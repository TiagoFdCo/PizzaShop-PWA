from __future__ import annotations

import os

import pytest
from fastapi.testclient import TestClient

# Garante modo mock para os testes de relatório rodarem sem banco real
os.environ.setdefault("REPORTS_USE_MOCK", "true")

from app.main import app  # noqa: E402 — import após setenv

CLIENT = TestClient(app, raise_server_exceptions=True)

ADMIN_USER = os.getenv("TEST_ADMIN_USER", "admin")
ADMIN_PASS = os.getenv("TEST_ADMIN_PASS", "admin123")


# ─── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def admin_token() -> str:
    """
    Faz login como admin e devolve o Bearer token.
    Se o banco não estiver configurado, pula a fixture graciosamente.
    """
    try:
        res = CLIENT.post(
            "/auth/login",
            json={"username": ADMIN_USER, "password": ADMIN_PASS},
        )
    except Exception as exc:
        pytest.skip(f"Backend não disponível para login: {exc}")

    if res.status_code == 404:
        pytest.skip("Endpoint /auth/login não encontrado — backend incompleto")

    assert res.status_code == 200, f"Login falhou: {res.text}"
    return res.json()["accessToken"]


@pytest.fixture(scope="module")
def auth_headers(admin_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {admin_token}"}


# ─── a) Fluxo legado de delivery ──────────────────────────────────────────────

class TestLegacyDeliveryFlow:
    """
    Garante que o fluxo de delivery (criado na Fase 2) não foi quebrado
    pelas adições da Fase 3 (relatórios, campos de custo, canal, rating).
    """

    def test_health_endpoint(self) -> None:
        """Sanity check básico — sempre deve responder 200."""
        res = CLIENT.get("/health")
        assert res.status_code == 200
        assert res.json() == {"status": "ok"}

    def test_get_orders_returns_list(self, auth_headers: dict) -> None:
        """GET /orders deve retornar uma lista (pode estar vazia)."""
        res = CLIENT.get("/orders", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list), f"Esperado list, recebido {type(data)}: {data}"

    def test_create_order_basic(self, auth_headers: dict) -> None:
        """
        POST /orders com payload mínimo deve retornar 201 ou 422.
        Busca um produto válido no banco para não quebrar a chave estrangeira (FK).
        """
        prod_res = CLIENT.get("/products", headers=auth_headers)
        products = prod_res.json() if prod_res.status_code == 200 else []
        product_id = products[0]["id"] if isinstance(products, list) and len(products) > 0 else "prod-test-001"

        payload = {
            "items": [
                {
                    "productId": product_id,
                    "name": "Pizza Margherita",
                    "imageUrl": "",
                    "size": "M",
                    "unitPrice": 42.0,
                    "quantity": 1,
                    "toppings": [],
                }
            ],
            "customer": {
                "name": "Cliente Teste",
                "address": "Rua dos Testes, 42",
                "phone": "92999990000",
            },
            "paymentMethod": "pix",
            "subtotal": 42.0,
            "deliveryFee": 8.0,
            "total": 50.0,
        }
        res = CLIENT.post("/orders", json=payload, headers=auth_headers)
        assert res.status_code in (200, 201, 422), (
            f"Esperado 201/422, recebido {res.status_code}: {res.text}"
        )

    def test_order_endpoints_not_500(self, auth_headers: dict) -> None:
        """Nenhum endpoint de orders deve retornar 500 (erro interno)."""
        endpoints = ["/orders"]
        for endpoint in endpoints:
            res = CLIENT.get(endpoint, headers=auth_headers)
            assert res.status_code != 500, (
                f"GET {endpoint} retornou 500: {res.text}"
            )

    def test_products_endpoint_intact(self, auth_headers: dict) -> None:
        """GET /products deve continuar funcionando normalmente."""
        res = CLIENT.get("/products", headers=auth_headers)
        assert res.status_code in (200, 307), f"Produtos: {res.status_code}"

    def test_staff_endpoint_intact(self, auth_headers: dict) -> None:
        """GET /staff deve continuar funcionando normalmente."""
        res = CLIENT.get("/staff", headers=auth_headers)
        assert res.status_code in (200, 307), f"Staff: {res.status_code}"


# ─── b) Rota /reports/export.xlsx ─────────────────────────────────────────────

class TestExportXlsx:
    """
    Testa o endpoint de exportação Excel — Issue #75 / #76.
    Usa REPORTS_USE_MOCK=true para não depender do banco real.
    """

    def test_export_returns_200(self, auth_headers: dict) -> None:
        """GET /reports/export.xlsx deve retornar HTTP 200."""
        res = CLIENT.get("/reports/export.xlsx", headers=auth_headers)
        assert res.status_code == 200, (
            f"Esperado 200, recebido {res.status_code}: {res.text}"
        )

    def test_export_content_type_xlsx(self, auth_headers: dict) -> None:
        """Content-Type deve ser a MIME type correta de .xlsx."""
        res = CLIENT.get("/reports/export.xlsx", headers=auth_headers)
        assert res.status_code == 200
        content_type = res.headers.get("content-type", "")
        assert "spreadsheetml" in content_type, (
            f"Content-Type inesperado: {content_type!r}"
        )

    def test_export_content_disposition(self, auth_headers: dict) -> None:
        """Content-Disposition deve indicar download com nome de arquivo."""
        res = CLIENT.get("/reports/export.xlsx", headers=auth_headers)
        assert res.status_code == 200
        disposition = res.headers.get("content-disposition", "")
        assert "attachment" in disposition, f"Disposition: {disposition!r}"
        assert ".xlsx" in disposition, f"Nome de arquivo ausente: {disposition!r}"

    def test_export_body_not_empty(self, auth_headers: dict) -> None:
        """O corpo da resposta não pode ser vazio — deve conter bytes de um .xlsx."""
        res = CLIENT.get("/reports/export.xlsx", headers=auth_headers)
        assert res.status_code == 200
        # Assinatura do formato ZIP (base do .xlsx): PK\x03\x04
        assert res.content[:4] == b"PK\x03\x04", (
            "Resposta não é um arquivo .xlsx válido (magic bytes errados)"
        )

    def test_export_requires_auth(self) -> None:
        """Sem token, o endpoint deve retornar 401 ou 403."""
        res = CLIENT.get("/reports/export.xlsx")
        assert res.status_code in (401, 403), (
            f"Endpoint deveria exigir auth, recebido {res.status_code}"
        )


# ─── c) Fluxo básico do dashboard financeiro ─────────────────────────────────

class TestFinancialDashboard:
    """
    Testa os endpoints JSON de relatório financeiro.
    Com REPORTS_USE_MOCK=true, retornam dados determinísticos.
    """

    def test_summary_returns_200(self, auth_headers: dict) -> None:
        res = CLIENT.get("/reports/summary", headers=auth_headers)
        assert res.status_code == 200, f"Summary: {res.status_code} — {res.text}"

    def test_summary_schema(self, auth_headers: dict) -> None:
        """Valida que o JSON tem os campos obrigatórios no formato camelCase."""
        res = CLIENT.get("/reports/summary", headers=auth_headers)
        assert res.status_code == 200
        body = res.json()

        required_keys = {
            "totalRevenue", "totalCost", "grossProfit",
            "ordersCount", "channelBreakdown", "staffBreakdown",
        }
        missing = required_keys - body.keys()
        assert not missing, f"Campos ausentes no summary: {missing}"

    def test_summary_values_coherent(self, auth_headers: dict) -> None:
        """grossProfit deve ser totalRevenue - totalCost (com tolerância de float)."""
        res = CLIENT.get("/reports/summary", headers=auth_headers)
        assert res.status_code == 200
        body = res.json()
        expected_profit = body["totalRevenue"] - body["totalCost"]
        assert abs(body["grossProfit"] - expected_profit) < 0.01, (
            f"Lucro inconsistente: {body['grossProfit']} != {expected_profit}"
        )

    def test_summary_channel_breakdown(self, auth_headers: dict) -> None:
        """channelBreakdown deve ter ao menos um item com os campos corretos."""
        res = CLIENT.get("/reports/summary", headers=auth_headers)
        assert res.status_code == 200
        channels = res.json()["channelBreakdown"]
        assert len(channels) >= 1, "channelBreakdown está vazio"
        first = channels[0]
        assert "channel" in first
        assert "revenue" in first
        assert "profit"  in first

    def test_ledger_returns_200(self, auth_headers: dict) -> None:
        res = CLIENT.get("/reports/ledger", headers=auth_headers)
        assert res.status_code == 200

    def test_ledger_is_list(self, auth_headers: dict) -> None:
        res = CLIENT.get("/reports/ledger", headers=auth_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_ledger_row_schema(self, auth_headers: dict) -> None:
        """Cada linha do ledger deve ter os campos essenciais."""
        res = CLIENT.get("/reports/ledger", headers=auth_headers)
        assert res.status_code == 200
        rows = res.json()
        if not rows:
            pytest.skip("Ledger vazio — sem pedidos entregues no banco mock")
        row = rows[0]
        for field in ("orderId", "total", "cost", "profit", "status"):
            assert field in row, f"Campo '{field}' ausente na linha do ledger"

    def test_reports_require_auth(self) -> None:
        """Todos os endpoints de /reports devem exigir autenticação."""
        for path in ("/reports/summary", "/reports/ledger"):
            res = CLIENT.get(path)
            assert res.status_code in (401, 403), (
                f"GET {path} deveria exigir auth, recebido {res.status_code}"
            )