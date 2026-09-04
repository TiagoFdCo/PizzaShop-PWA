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
from pathlib import Path

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.product import Product, ProductTopping
from app.models.staff import Staff, StaffRole
from app.models.tenant import Tenant

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
        product = Product(
            tenant_id=tenant.id,
            name=p.get("name", ""),
            description=p.get("description", ""),
            image_url=p.get("imageUrl", ""),
            category=p.get("category", ""),
            base_price=p.get("basePrice", 0),
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


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--db-json",
        type=Path,
        # Procura db.json na raiz do projeto (um nível acima de backend/)
        default=Path(__file__).resolve().parent.parent / "db.json",
        help="Caminho pro db.json (default: ../../db.json relativo a scripts/seed.py)",
    )
    args = parser.parse_args()

    if not args.db_json.exists():
        # Fallback: db.json dentro de backend/ (cópia usada no container Docker)
        fallback = Path(__file__).resolve().parent.parent / "backend" / "db.json"
        if fallback.exists():
            args.db_json = fallback
        else:
            raise FileNotFoundError(
                f"db.json não encontrado em '{args.db_json}'. "
                "Passe --db-json <caminho> ou copie o arquivo para o local esperado."
            )

    print(f"\n=== Seed — lendo '{args.db_json}' ===\n")
    data = load_db_json(args.db_json)

    db = SessionLocal()
    try:
        print("[1/3] Tenant")
        tenant = seed_tenant(db, data)

        print("[2/3] Produtos")
        seed_products(db, tenant, data)

        print("[3/3] Usuários padrão")
        seed_staff(db)
    finally:
        db.close()

    print("\n=== Seed concluído! ===")
    print("Credenciais de acesso:")
    for entry in DEFAULT_STAFF:
        print(f"  [{entry['role'].value:8s}]  {entry['username']} / {entry['password']}")
    print()


if __name__ == "__main__":
    main()
