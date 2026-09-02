import uuid

from sqlalchemy import ARRAY, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Tenant(Base):
    """
    Configuração white-label da pizzaria. Na prática, uma linha só nesta
    tabela por enquanto (o projeto atende uma pizzaria por deploy), mas fica
    modelada como entidade própria pra não hardcodar nada no código — e pra
    servir de FK em product/order (facilita multi-tenant real no futuro).
    """

    __tablename__ = "tenant"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    tagline: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    about_text: Mapped[str] = mapped_column(String(2000), nullable=False, default="")
    logo_url: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    banner_url: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    primary_color: Mapped[str] = mapped_column(String(20), nullable=False, default="#c0392b")
    secondary_color: Mapped[str] = mapped_column(String(20), nullable=False, default="#272b33")
    address: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    opening_hours: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    whatsapp: Mapped[str] = mapped_column(String(30), nullable=False, default="")
    instagram: Mapped[str] = mapped_column(String(60), nullable=False, default="")
    delivery_fee: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    delivery_radius_km: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    avg_prep_time_min: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    min_order_value: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    # Lista simples de strings ("pix" | "cartao" | "dinheiro"); validação de
    # valores permitidos fica no schema Pydantic, não no banco.
    enabled_payment_methods: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)

    def __repr__(self) -> str:
        return f"<Tenant id={self.id} name={self.name}>"
