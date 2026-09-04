from sqlalchemy.orm import Session

from app.models.tenant import Tenant
from app.schemas.tenant import TenantUpdate


def get_tenant(db: Session) -> Tenant | None:
    """Projeto atende uma pizzaria por deploy — sempre a primeira linha."""
    return db.query(Tenant).first()


def update_tenant(db: Session, tenant: Tenant, data: TenantUpdate) -> Tenant:
    for field, value in data.model_dump().items():
        setattr(tenant, field, value)
    db.commit()
    db.refresh(tenant)
    return tenant
