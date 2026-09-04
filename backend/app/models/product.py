import uuid

from sqlalchemy import ARRAY, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Product(Base):
    """Uma pizza do cardápio. `available_sizes` fica como array de strings
    (P/M/G) — validado no schema Pydantic, sem tabela própria (não há atributo
    além do rótulo em si)."""

    __tablename__ = "product"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenant.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    image_url: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    category: Mapped[str] = mapped_column(String(40), nullable=False)
    base_price: Mapped[float] = mapped_column(Float, nullable=False)
    available_sizes: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)

    toppings: Mapped[list["ProductTopping"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Product id={self.id} name={self.name}>"


class ProductTopping(Base):
    """Adicional disponível para um produto específico (ex.: borda recheada)."""

    __tablename__ = "product_topping"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("product.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)

    product: Mapped["Product"] = relationship(back_populates="toppings")
