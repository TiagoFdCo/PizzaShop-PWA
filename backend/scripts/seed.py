"""
Lê o db.json do front (json-server) e popula o Postgres, reaproveitando o
tenant e o cardápio que já existem em vez de recriar tudo na mão.

Uso (dentro do container da API, ou local com DATABASE_URL apontando pro
Postgres certo):

    python -m scripts.seed [--db-json ../db.json]

Idempotente: se já existir um tenant, o script pula a criação de
tenant/produtos (evita duplicar o cardápio a cada `docker-compose up`).
Sempre garante que os usuários padrão existam.
"""
import argparse
import json
from datetime import date, timedelta
from pathlib import Path

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.expense import Expense, ExpenseCategory
from app.models.product import Product, ProductTopping
from app.models.staff import Staff, StaffRole
from app.models.tenant import Tenant
from app.models.waiter import RestaurantTable

# -----------------------------------------------------------------------
# Usuários padrão criados pelo seed
# (troque as senhas após o primeiro login em produção)
# -----------------------------------------------------------------------
DEFAULT_STAFF = [
    {
        "name": "Administrador",
        "role": StaffRole.admin,
        "username": "admin",
        "password": "admin123",
    },
    {
        "name": "Cozinheiro",
        "role": StaffRole.cozinha,
        "username": "cozinha",
        "password": "cozinha123",
    },
    {
        "name": "Entregador",
        "role": StaffRole.entrega,
        "username": "entrega",
        "password": "entrega123",
    },
    {
        # Corrigido: não havia nenhum usuário garçom no seed — sem ele
        # ninguém consegue logar em /garcom pra demonstrar mesas/comandas.
        "name": "Garçom",
        "role": StaffRole.garcom,
        "username": "garcom",
        "password": "garcom123",
    },
]

# COGS aproximado quando o db.json não informa custo (corrigido: sem isso
# todo produto seedado nasce com cost=0 e o "lucro" do financeiro fica
# sempre igual ao faturamento — nada realista pra apresentação).
_DEFAULT_COST_RATIO = 0.4

# Mesas de demonstração (corrigido: nenhuma mesa existia no banco real —
# sem elas o garçom não tem em cima do que abrir comanda).
_DEFAULT_TABLES = [
    {"number": 1, "seats": 2},
    {"number": 2, "seats": 2},
    {"number": 3, "seats": 4},
    {"number": 4, "seats": 4},
    {"number": 5, "seats": 6},
    {"number": 6, "seats": 6},
]

# Despesas de demonstração (Financeiro): datas relativas a hoje, pra sempre
# caírem no mês corrente na tela de despesas, não importa quando o seed rodar.
_DEFAULT_EXPENSES = [
    {"description": "Aluguel do salão", "category": ExpenseCategory.aluguel, "amount": 3200.0, "days_ago": 9},
    {"description": "Conta de energia", "category": ExpenseCategory.energia, "amount": 480.0, "days_ago": 7},
    {"description": "Conta de água", "category": ExpenseCategory.agua, "amount": 150.0, "days_ago": 7},
    {"description": "Internet + telefone", "category": ExpenseCategory.internet, "amount": 200.0, "days_ago": 6},
    {"description": "Compra de mussarela e farinha", "category": ExpenseCategory.ingredientes, "amount": 890.0, "days_ago": 3},
    {"description": "Folha de pagamento", "category": ExpenseCategory.funcionarios, "amount": 5400.0, "days_ago": 1},
]


def load_db_json(path: Path) -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def seed_tenant(db, data: dict) -> Tenant:
    existing = db.query(Tenant).first()
    if existing is not None:
        print(f"  Tenant já existe ({existing.name}), pulando criação.")
        return existing

    t = data["tenant"]
    tenant = Tenant(
        name=t.get("name", ""),
        tagline=t.get("tagline", ""),
        about_text=t.get("aboutText", ""),
        logo_url=t.get("logoUrl", ""),
        banner_url=t.get("bannerUrl", ""),
        primary_color=t.get("primaryColor", "#c0392b"),
        secondary_color=t.get("secondaryColor", "#272b33"),
        address=t.get("address", ""),
        opening_hours=t.get("openingHours", ""),
        whatsapp=t.get("whatsapp", ""),
        instagram=t.get("instagram", ""),
        delivery_fee=t.get("deliveryFee", 0),
        delivery_radius_km=t.get("deliveryRadiusKm", 0),
        avg_prep_time_min=t.get("avgPrepTimeMin", 30),
        min_order_value=t.get("minOrderValue", 0),
        enabled_payment_methods=t.get("enabledPaymentMethods", []),
    )
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    print(f"  Tenant criado: {tenant.name}")
    return tenant


def seed_products(db, tenant: Tenant, data: dict) -> None:
    if db.query(Product).filter(Product.tenant_id == tenant.id).count() > 0:
        print("  Produtos já existem, pulando criação.")
        return

    products = data.get("products", [])
    for p in products:
        base_price = p.get("basePrice", 0)
        # Corrigido (D1): db.json não tem campo de custo — sem isso o
        # produto nascia com cost=0 e o financeiro nunca mostrava lucro real.
        cost = p.get("cost", round(base_price * _DEFAULT_COST_RATIO, 2))
        product = Product(
            tenant_id=tenant.id,
            name=p.get("name", ""),
            description=p.get("description", ""),
            image_url=p.get("imageUrl", ""),
            category=p.get("category", ""),
            base_price=base_price,
            cost=cost,
            available_sizes=p.get("availableSizes", []),
        )
        product.toppings = [
            ProductTopping(name=t["name"], price=t["price"])
            for t in p.get("availableToppings", [])
        ]
        db.add(product)

    db.commit()
    print(f"  {len(products)} produto(s) criado(s).")


def seed_staff(db) -> None:
    for entry in DEFAULT_STAFF:
        existing = db.query(Staff).filter(Staff.username == entry["username"]).first()
        if existing is not None:
            print(f"  Usuário '{entry['username']}' já existe, pulando.")
            continue

        staff = Staff(
            name=entry["name"],
            role=entry["role"],
            username=entry["username"],
            password_hash=hash_password(entry["password"]),
        )
        db.add(staff)
        db.commit()
        print(
            f"  Usuário criado: username='{entry['username']}'"
            f"  senha='{entry['password']}'  role={entry['role'].value}"
        )


def seed_tables(db, tenant: Tenant) -> None:
    """Corrigido: nenhuma mesa era criada no banco real — a tela do garçom
    (/garcom/mesas) ficava sempre vazia sem um passo manual via API."""
    if db.query(RestaurantTable).filter(RestaurantTable.tenant_id == tenant.id).count() > 0:
        print("  Mesas já existem, pulando criação.")
        return

    for t in _DEFAULT_TABLES:
        db.add(RestaurantTable(tenant_id=tenant.id, number=t["number"], seats=t["seats"]))

    db.commit()
    print(f"  {len(_DEFAULT_TABLES)} mesa(s) criada(s).")


def seed_expenses(db, tenant: Tenant) -> None:
    """Despesas de demonstração pro Financeiro já nascer com dado real."""
    if db.query(Expense).filter(Expense.tenant_id == tenant.id).count() > 0:
        print("  Despesas já existem, pulando criação.")
        return

    today = date.today()
    for e in _DEFAULT_EXPENSES:
        db.add(Expense(
            tenant_id=tenant.id,
            description=e["description"],
            category=e["category"],
            amount=e["amount"],
            date=today - timedelta(days=e["days_ago"]),
        ))

    db.commit()
    print(f"  {len(_DEFAULT_EXPENSES)} despesa(s) criada(s).")


def _resolve_db_json(explicit: Path | None) -> Path:
    """Encontra o db.json de forma robusta a host e container.

    No host, scripts/seed.py fica em backend/scripts/, e o db.json pode estar
    em backend/ ou na raiz do projeto (um nível acima). No container do
    docker-compose, backend/ é montado como /app, então "um nível acima" cai
    fora do projeto — por isso tentamos vários candidatos em vez de assumir um.
    """
    if explicit is not None:
        if explicit.exists():
            return explicit
        raise FileNotFoundError(f"db.json não encontrado em '{explicit}'.")

    here = Path(__file__).resolve()
    candidates = [
        here.parent.parent / "db.json",           # backend/db.json  (container: /app/db.json)
        here.parent.parent.parent / "db.json",    # raiz do projeto (host, um nível acima de backend/)
        Path.cwd() / "db.json",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate

    tentativas = "\n  ".join(str(c) for c in candidates)
    raise FileNotFoundError(
        "db.json não encontrado. Locais tentados:\n  "
        + tentativas
        + "\nPasse --db-json <caminho> explicitamente."
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--db-json",
        type=Path,
        default=None,
        help="Caminho pro db.json. Se omitido, procura em locais conhecidos "
        "(backend/db.json, raiz do projeto, diretório atual).",
    )
    args = parser.parse_args()

    args.db_json = _resolve_db_json(args.db_json)

    print(f"\n=== Seed — lendo '{args.db_json}' ===\n")
    data = load_db_json(args.db_json)

    db = SessionLocal()
    try:
        print("[1/5] Tenant")
        tenant = seed_tenant(db, data)

        print("[2/5] Produtos")
        seed_products(db, tenant, data)

        print("[3/5] Usuários padrão")
        seed_staff(db)

        print("[4/5] Mesas")
        seed_tables(db, tenant)

        print("[5/5] Despesas")
        seed_expenses(db, tenant)
    finally:
        db.close()

    print("\n=== Seed concluído! ===")
    print("Credenciais de acesso:")
    for entry in DEFAULT_STAFF:
        print(f"  [{entry['role'].value:8s}]  {entry['username']} / {entry['password']}")
    print()


if __name__ == "__main__":
    main()
