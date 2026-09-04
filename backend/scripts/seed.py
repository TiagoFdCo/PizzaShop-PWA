"""
Lê o db.json do front (json-server) e popula o Postgres, reaproveitando o
tenant e o cardápio que já existem em vez de recriar tudo na mão.

Uso (dentro do container da API, ou local com DATABASE_URL apontando pro
Postgres certo):

    python -m scripts.seed [--db-json ../db.json]

Idempotente: se já existir um tenant, o script pula a criação de
tenant/produtos (evita duplicar o cardápio a cada `docker-compose up`).
Sempre garante que o admin padrão exista.
"""
import argparse
import json
from pathlib import Path

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.product import Product, ProductTopping
from app.models.staff import Staff, StaffRole
from app.models.tenant import Tenant

DEFAULT_ADMIN_USERNAME = "admin"
DEFAULT_ADMIN_PASSWORD = "admin123"  # troque após o primeiro login em produção


def load_db_json(path: Path) -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def seed_tenant(db, data: dict) -> Tenant:
    existing = db.query(Tenant).first()
    if existing is not None:
        print(f"Tenant já existe ({existing.name}), pulando criação.")
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
    print(f"Tenant criado: {tenant.name}")
    return tenant


def seed_products(db, tenant: Tenant, data: dict) -> None:
    if db.query(Product).filter(Product.tenant_id == tenant.id).count() > 0:
        print("Produtos já existem, pulando criação.")
        return

    for p in data.get("products", []):
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
            ProductTopping(name=t["name"], price=t["price"]) for t in p.get("availableToppings", [])
        ]
        db.add(product)

    db.commit()
    print(f"{len(data.get('products', []))} produtos criados.")


def seed_default_admin(db) -> None:
    existing = db.query(Staff).filter(Staff.username == DEFAULT_ADMIN_USERNAME).first()
    if existing is not None:
        print("Admin padrão já existe, pulando criação.")
        return

    admin = Staff(
        name="Administrador",
        role=StaffRole.admin,
        username=DEFAULT_ADMIN_USERNAME,
        password_hash=hash_password(DEFAULT_ADMIN_PASSWORD),
    )
    db.add(admin)
    db.commit()
    print(f"Admin padrão criado: usuário='{DEFAULT_ADMIN_USERNAME}' senha='{DEFAULT_ADMIN_PASSWORD}' (troque depois)")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--db-json",
        type=Path,
        default=Path(__file__).resolve().parent.parent / "db.json",
        help="Caminho pro db.json do front (default: ../db.json a partir de scripts/, ou seja backend/db.json)",
    )
    args = parser.parse_args()

    data = load_db_json(args.db_json)

    db = SessionLocal()
    try:
        tenant = seed_tenant(db, data)
        seed_products(db, tenant, data)
        seed_default_admin(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
