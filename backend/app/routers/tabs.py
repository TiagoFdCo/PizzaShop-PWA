"""Rotas de COMANDAS. Padrão de routers/orders.py.
O waiter_id sai do STAFF LOGADO (Depends injeta o Staff), não do body."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.crud import table as crud_table
from app.crud.table import ConflictError
from app.crud.tenant import get_tenant
from app.db.session import get_db
from app.deps import require_role
from app.models.staff import Staff, StaffRole
from app.models.table import Tab, TabStatus
from app.schemas.order import OrderItemOut
from app.schemas.table import TabInput, TabOrderInput, TabOrderView, TabOut

router = APIRouter(prefix="/tabs", tags=["tabs"])


def _tenant_id(db: Session) -> str:
    tenant = get_tenant(db)
    if tenant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant não configurado")
    return tenant.id


def _tab_to_out(tab: Tab) -> TabOut:
    return TabOut(
        id=tab.id,
        table_id=tab.table_id,
        table_number=tab.table.number,
        waiter_id=tab.waiter_id,
        status=tab.status,
        opened_at=tab.opened_at,
        closed_at=tab.closed_at,
        total=tab.total,
        orders=[
            TabOrderView(
                id=o.id,
                items=[OrderItemOut.model_validate(it) for it in o.items],
                channel=o.channel,
                subtotal=o.subtotal,
                total=o.total,
                created_at=o.created_at,
            )
            for o in tab.orders
        ],
    )


@router.post("", response_model=TabOut, status_code=status.HTTP_201_CREATED)
def open_tab(
    payload: TabInput,
    db: Session = Depends(get_db),
    staff: Staff = Depends(require_role([StaffRole.admin, StaffRole.garcom])),
):
    try:
        tab = crud_table.open_tab(db, _tenant_id(db), payload.table_id, waiter_id=staff.id)
    except ConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    if tab is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mesa não encontrada")
    return _tab_to_out(tab)


@router.get("", response_model=list[TabOut])
def list_tabs(
    status_filter: TabStatus | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    _: Staff = Depends(require_role([StaffRole.admin, StaffRole.garcom])),
):
    # query param "status" -> alias abaixo mantém a URL /tabs?status=aberta
    tabs = crud_table.list_tabs(db, _tenant_id(db), status_filter)
    return [_tab_to_out(t) for t in tabs]


@router.get("/{tab_id}", response_model=TabOut)
def get_tab(
    tab_id: str,
    db: Session = Depends(get_db),
    _: Staff = Depends(require_role([StaffRole.admin, StaffRole.garcom])),
):
    tab = crud_table.get_tab(db, _tenant_id(db), tab_id)
    if tab is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comanda não encontrada")
    return _tab_to_out(tab)


@router.post("/{tab_id}/orders", response_model=TabOut, status_code=status.HTTP_201_CREATED)
def add_order(
    tab_id: str,
    payload: TabOrderInput,
    db: Session = Depends(get_db),
    _: Staff = Depends(require_role([StaffRole.admin, StaffRole.garcom])),
):
    try:
        tab = crud_table.add_order_to_tab(db, _tenant_id(db), tab_id, payload.items)
    except ConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    if tab is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comanda não encontrada")
    return _tab_to_out(tab)


@router.patch("/{tab_id}/close", response_model=TabOut)
def close_tab(
    tab_id: str,
    db: Session = Depends(get_db),
    _: Staff = Depends(require_role([StaffRole.admin, StaffRole.garcom])),
):
    try:
        tab = crud_table.close_tab(db, _tenant_id(db), tab_id)
    except ConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    if tab is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comanda não encontrada")
    return _tab_to_out(tab)


@router.patch("/{tab_id}/pay", response_model=TabOut)
def pay_tab(
    tab_id: str,
    db: Session = Depends(get_db),
    _: Staff = Depends(require_role([StaffRole.admin, StaffRole.garcom])),
):
    try:
        tab = crud_table.pay_tab(db, _tenant_id(db), tab_id)
    except ConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    if tab is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comanda não encontrada")
    return _tab_to_out(tab)
