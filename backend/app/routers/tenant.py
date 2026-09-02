from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud.tenant import get_tenant, update_tenant
from app.db.session import get_db
from app.deps import require_role
from app.models.staff import StaffRole
from app.schemas.tenant import TenantOut, TenantUpdate

router = APIRouter(prefix="/tenant", tags=["tenant"])


@router.get("", response_model=TenantOut)
def read_tenant(db: Session = Depends(get_db)) -> TenantOut:
    tenant = get_tenant(db)
    if tenant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant não configurado")
    return TenantOut.model_validate(tenant)


@router.put("", response_model=TenantOut)
def write_tenant(
    data: TenantUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(require_role([StaffRole.admin])),
) -> TenantOut:
    tenant = get_tenant(db)
    if tenant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant não configurado")
    tenant = update_tenant(db, tenant, data)
    return TenantOut.model_validate(tenant)
