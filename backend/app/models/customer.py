import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Customer(Base):
    """
    Cliente da loja (autentica com CPF + senha). Distinto de Staff: cliente
    nunca acessa telas administrativas/operacionais, só a loja pública.
    O `cpf` é salvo já normalizado (só dígitos, 11 caracteres).
    """

    __tablename__ = "customer"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    phone: Mapped[str] = mapped_column(String(30), nullable=False)
    cpf: Mapped[str] = mapped_column(String(11), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    # Endereço (Fase 4): preenchido no cadastro via busca de CEP (ViaCEP) no
    # front — cliente digita o CEP, número e complemento; rua/bairro/
    # cidade/UF vêm da API e chegam aqui já prontos, não digitados à mão.
    cep: Mapped[str] = mapped_column(String(8), nullable=False)
    street: Mapped[str] = mapped_column(String(180), nullable=False)
    number: Mapped[str] = mapped_column(String(20), nullable=False)
    complement: Mapped[str | None] = mapped_column(String(120), nullable=True)
    neighborhood: Mapped[str] = mapped_column(String(120), nullable=False)
    city: Mapped[str] = mapped_column(String(120), nullable=False)
    state: Mapped[str] = mapped_column(String(2), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def __repr__(self) -> str:
        return f"<Customer id={self.id} cpf={self.cpf}>"
