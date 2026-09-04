from pydantic import AliasChoices, Field

from app.schemas.common import CamelModel


class ToppingOut(CamelModel):
    id: str
    name: str
    price: float


class ToppingInput(CamelModel):
    """Usado dentro de ProductInput — sem id (gerado pela API ao salvar)."""

    name: str
    price: float


class ProductBase(CamelModel):
    name: str
    description: str = ""
    image_url: str = ""
    category: str
    base_price: float
    available_sizes: list[str] = []  # subset de ["P", "M", "G"]


class ProductInput(ProductBase):
    """Payload de POST/PUT /products."""

    available_toppings: list[ToppingInput] = Field(
        default=[],
        validation_alias=AliasChoices("availableToppings", "available_toppings"),
    )


class ProductOut(ProductBase):
    id: str
    # O ORM expõe o relacionamento como `toppings`; o JSON usa `availableToppings`.
    # AliasChoices lê de ambos (from_attributes pega `toppings` do ORM);
    # serialization_alias garante a saída em camelCase pro front.
    available_toppings: list[ToppingOut] = Field(
        default=[],
        validation_alias=AliasChoices("toppings", "availableToppings", "available_toppings"),
        serialization_alias="availableToppings",
    )
