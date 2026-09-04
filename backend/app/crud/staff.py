from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.staff import Staff, StaffRole
from app.schemas.staff import StaffCreate


def get_by_username(db: Session, username: str) -> Staff | None:
    return db.query(Staff).filter(Staff.username == username).first()


def list_staff(db: Session, role: StaffRole | None = None) -> list[Staff]:
    """role=entrega é o que a cozinha usa pra montar o seletor de entregador
    no PATCH /orders/{id}/dispatch."""
    query = db.query(Staff)
    if role is not None:
        query = query.filter(Staff.role == role)
    return query.all()


def create_staff(db: Session, data: StaffCreate) -> Staff:
    staff = Staff(
        name=data.name,
        role=data.role,
        username=data.username,
        password_hash=hash_password(data.password),
    )
    db.add(staff)
    db.commit()
    db.refresh(staff)
    return staff


def delete_staff(db: Session, staff: Staff) -> None:
    db.delete(staff)
    db.commit()