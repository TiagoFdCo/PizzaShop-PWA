import enum
import uuid

from sqlalchemy import Enum as SAEnum
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class StaffRole(str, enum.Enum):
    admin = "admin"
    cozinha = "cozinha"
    entrega = "entrega"


class Staff(Base):
    """
    Funcionário que faz login no sistema (admin, cozinheiro ou entregador).
    Cliente NÃO tem linha aqui — ele não autentica (ver Order.customer_*).
    """

    __tablename__ = "staff"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    role: Mapped[StaffRole] = mapped_column(SAEnum(StaffRole, name="staff_role"), nullable=False)
    username: Mapped[str] = mapped_column(String(60), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    def __repr__(self) -> str:
        return f"<Staff id={self.id} username={self.username} role={self.role}>"
