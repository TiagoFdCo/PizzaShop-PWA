"""
Fase 4 (P3) — testes de cupons e fidelidade.

Rodam contra o Postgres de verdade (mesmo padrão do test_integration.py):
precisa de `alembic upgrade head` + `python -m scripts.seed` antes.

    cd backend && pytest tests/test_cupons_fidelidade.py -v

O token de CLIENTE é gerado direto com create_access_token(role="customer"),
então estes testes não dependem do login de cliente do P1 estar pronto.
"""
from __future__ import annotations

import os
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("REPORTS_USE_MOCK", "true")

from app.core.security import create_access_token  # noqa: E402
from app.main import app  # noqa: E402

CLIENT = TestClient(app)
ADMIN_USER = os.getenv("TEST_ADMIN_USER", "admin")
ADMIN_PASS = os.getenv("TEST_ADMIN_PASS", "admin123")


# ─── Fixtures ──────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def admin_headers() -> dict[str, str]:
    try:
        res = CLIENT.post("/auth/login", json={"username": ADMIN_USER, "password": ADMIN_PASS})
    except Exception as exc:  # banco fora do ar
        pytest.skip(f"Backend/banco indisponível: {exc}")
    if res.status_code != 200:
        pytest.skip(f"Login admin falhou (rodou o seed?): {res.text}")
    return {"Authorization": f"Bearer {res.json()['accessToken']}"}


@pytest.fixture(scope="module")
def product_id() -> str:
    res = CLIENT.get("/products")
    if res.status_code != 200 or not res.json():
        pytest.skip("Sem produtos no banco — rode o seed")
    return res.json()[0]["id"]


def _customer_headers() -> dict[str, str]:
    """Cliente novo a cada chamada (saldo começa em zero)."""
    token = create_access_token(staff_id=str(uuid.uuid4()), role="customer", name="Cliente Teste")
    return {"Authorization": f"Bearer {token}"}


_CREATED_IDS: list[str] = []


@pytest.fixture(scope="module", autouse=True)
def _cleanup_coupons(admin_headers):
    """Apaga os cupons de teste no fim — senão eles lotam a tela /admin/cupons."""
    yield
    for coupon_id in _CREATED_IDS:
        CLIENT.delete(f"/coupons/{coupon_id}", headers=admin_headers)


def _code() -> str:
    return "T" + uuid.uuid4().hex[:8].upper()


def _create_coupon(admin_headers: dict, **overrides) -> dict:
    body = {"code": _code(), "discountType": "percentual", "value": 10, **overrides}
    res = CLIENT.post("/coupons", json=body, headers=admin_headers)
    assert res.status_code == 201, res.text
    _CREATED_IDS.append(res.json()["id"])
    return res.json()


def _order_payload(product_id: str, subtotal: float = 100.0, **extra) -> dict:
    return {
        "items": [{
            "productId": product_id, "name": "Pizza teste", "size": "G",
            "unitPrice": subtotal, "quantity": 1, "toppings": [],
        }],
        "customer": {"name": "Fulano", "address": "Rua A, 1", "phone": "92999999999"},
        "paymentMethod": "pix",
        "subtotal": subtotal,
        "deliveryFee": 5.0,
        "total": subtotal + 5.0,
        **extra,
    }


# ─── Cupom: validação ──────────────────────────────────────────────────────

class TestCouponValidation:
    def test_percentual_valido(self, admin_headers):
        c = _create_coupon(admin_headers, value=15)
        res = CLIENT.post("/coupons/validate", json={"code": c["code"].lower(), "subtotal": 80})
        assert res.status_code == 200, res.text
        assert res.json()["discount"] == 12.0  # 15% de 80, código aceito em minúsculas

    def test_valor_fixo_limitado_ao_subtotal(self, admin_headers):
        c = _create_coupon(admin_headers, discountType="valor_fixo", value=50)
        res = CLIENT.post("/coupons/validate", json={"code": c["code"], "subtotal": 30})
        assert res.json()["discount"] == 30.0

    def test_inexistente(self):
        res = CLIENT.post("/coupons/validate", json={"code": "NAOEXISTE123", "subtotal": 50})
        assert res.status_code == 404
        assert res.json()["detail"] == "Cupom não encontrado"

    def test_expirado(self, admin_headers):
        past = datetime.now(timezone.utc) - timedelta(days=10)
        c = _create_coupon(admin_headers, validFrom=past.isoformat(),
                           validUntil=(past + timedelta(days=1)).isoformat())
        res = CLIENT.post("/coupons/validate", json={"code": c["code"], "subtotal": 50})
        assert res.status_code == 400 and res.json()["detail"] == "Cupom expirado"

    def test_ainda_nao_valido(self, admin_headers):
        future = datetime.now(timezone.utc) + timedelta(days=2)
        c = _create_coupon(admin_headers, validFrom=future.isoformat())
        res = CLIENT.post("/coupons/validate", json={"code": c["code"], "subtotal": 50})
        assert res.json()["detail"] == "Cupom ainda não está válido"

    def test_desativado(self, admin_headers):
        c = _create_coupon(admin_headers)
        CLIENT.patch(f"/coupons/{c['id']}", json={"active": False}, headers=admin_headers)
        res = CLIENT.post("/coupons/validate", json={"code": c["code"], "subtotal": 50})
        assert res.json()["detail"] == "Cupom desativado"

    def test_pedido_minimo(self, admin_headers):
        c = _create_coupon(admin_headers, minOrderValue=60)
        res = CLIENT.post("/coupons/validate", json={"code": c["code"], "subtotal": 50})
        assert res.status_code == 400 and "pedido mínimo" in res.json()["detail"]

    def test_codigo_duplicado(self, admin_headers):
        c = _create_coupon(admin_headers)
        res = CLIENT.post("/coupons", json={"code": c["code"], "discountType": "percentual", "value": 5},
                          headers=admin_headers)
        assert res.status_code == 409

    def test_percentual_acima_de_100(self, admin_headers):
        res = CLIENT.post("/coupons", json={"code": _code(), "discountType": "percentual", "value": 150},
                          headers=admin_headers)
        assert res.status_code == 422

    def test_admin_obrigatorio(self):
        assert CLIENT.get("/coupons").status_code == 401


# ─── Cupom aplicado no pedido ──────────────────────────────────────────────

class TestCouponOnOrder:
    def test_pedido_sem_cupom_continua_igual(self, product_id):
        res = CLIENT.post("/orders", json=_order_payload(product_id))
        assert res.status_code == 201, res.text
        body = res.json()
        assert body["total"] == 105.0 and body["couponDiscount"] == 0 and body["pointsEarned"] == 0

    def test_total_recalculado_no_backend(self, admin_headers, product_id):
        c = _create_coupon(admin_headers, value=20)
        payload = _order_payload(product_id, couponCode=c["code"])
        payload["total"] = 1.0  # front mandando total errado: deve ser ignorado
        body = CLIENT.post("/orders", json=payload).json()
        assert body["couponCode"] == c["code"]
        assert body["couponDiscount"] == 20.0
        assert body["total"] == 85.0  # 100 - 20 + 5 de entrega

    def test_max_uses_esgota(self, admin_headers, product_id):
        c = _create_coupon(admin_headers, maxUses=1)
        assert CLIENT.post("/orders", json=_order_payload(product_id, couponCode=c["code"])).status_code == 201
        res = CLIENT.post("/orders", json=_order_payload(product_id, couponCode=c["code"]))
        assert res.status_code == 400 and res.json()["detail"] == "Cupom esgotado"


# ─── Fidelidade ────────────────────────────────────────────────────────────

class TestLoyalty:
    def test_me_exige_login_de_cliente(self, admin_headers):
        assert CLIENT.get("/loyalty/me").status_code == 401
        assert CLIENT.get("/loyalty/me", headers=admin_headers).status_code == 401  # staff não é cliente

    def test_cliente_novo_tem_saldo_zero(self):
        body = CLIENT.get("/loyalty/me", headers=_customer_headers()).json()
        assert body["pointsBalance"] == 0
        assert body["rules"] == {"pointsPerReal": 1, "redeemBlock": 100, "reaisPerBlock": 10.0}

    def test_ganha_pontos_sem_contar_entrega(self, product_id):
        h = _customer_headers()
        body = CLIENT.post("/orders", json=_order_payload(product_id, 57.9), headers=h).json()
        assert body["pointsEarned"] == 57
        assert CLIENT.get("/loyalty/me", headers=h).json()["pointsBalance"] == 57

    def test_anonimo_nao_ganha_nem_resgata(self, product_id):
        assert CLIENT.post("/orders", json=_order_payload(product_id)).json()["pointsEarned"] == 0
        res = CLIENT.post("/orders", json=_order_payload(product_id, redeemPoints=100))
        assert res.status_code == 400 and "login" in res.json()["detail"]

    def test_resgate_completo(self, admin_headers, product_id):
        h = _customer_headers()
        CLIENT.post("/orders", json=_order_payload(product_id, 250), headers=h)  # +250
        c = _create_coupon(admin_headers, discountType="valor_fixo", value=10)
        body = CLIENT.post(
            "/orders", json=_order_payload(product_id, 100, couponCode=c["code"], redeemPoints=200), headers=h
        ).json()
        # 100 - 10 (cupom) - 20 (200 pts) = 70 em produtos; +5 entrega
        assert body["loyaltyDiscount"] == 20.0
        assert body["total"] == 75.0
        assert body["pointsEarned"] == 70
        me = CLIENT.get("/loyalty/me", headers=h).json()
        assert me["pointsBalance"] == 250 - 200 + 70
        assert [t["type"] for t in me["transactions"]].count("resgate") == 1

    def test_resgate_fora_do_bloco(self, product_id):
        h = _customer_headers()
        CLIENT.post("/orders", json=_order_payload(product_id, 300), headers=h)
        res = CLIENT.post("/orders", json=_order_payload(product_id, redeemPoints=150), headers=h)
        assert res.status_code == 400 and "blocos de 100" in res.json()["detail"]

    def test_saldo_insuficiente_nao_grava_pedido(self, product_id):
        h = _customer_headers()
        CLIENT.post("/orders", json=_order_payload(product_id, 50), headers=h)  # 50 pts
        res = CLIENT.post("/orders", json=_order_payload(product_id, redeemPoints=100), headers=h)
        assert res.status_code == 400 and res.json()["detail"] == "Saldo de pontos insuficiente"
        assert CLIENT.get("/loyalty/me", headers=h).json()["pointsBalance"] == 50  # rollback ok

    def test_desconto_nao_passa_do_subtotal(self, product_id):
        h = _customer_headers()
        CLIENT.post("/orders", json=_order_payload(product_id, 500), headers=h)
        res = CLIENT.post("/orders", json=_order_payload(product_id, 15, redeemPoints=200), headers=h)
        assert res.status_code == 400 and "maior que o valor dos produtos" in res.json()["detail"]


# ─── Estorno (gancho pro Pagamento do P1) ──────────────────────────────────

class TestRevert:
    def test_revert_idempotente(self, admin_headers, product_id):
        from app.crud.discount import revert_order_discounts
        from app.db.session import SessionLocal
        from app.models.coupon import Coupon
        from app.models.order import Order

        h = _customer_headers()
        CLIENT.post("/orders", json=_order_payload(product_id, 200), headers=h)  # 200 pts
        c = _create_coupon(admin_headers)
        order = CLIENT.post(
            "/orders", json=_order_payload(product_id, 100, couponCode=c["code"], redeemPoints=100), headers=h
        ).json()
        assert CLIENT.get("/loyalty/me", headers=h).json()["pointsBalance"] == 200 - 100 + 80

        with SessionLocal() as db:
            o = db.get(Order, order["id"])
            revert_order_discounts(db, o)
            revert_order_discounts(db, o)  # 2ª vez não faz nada
            db.commit()
            assert db.get(Coupon, c["id"]).uses_count == 0

        assert CLIENT.get("/loyalty/me", headers=h).json()["pointsBalance"] == 200
