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

    available_toppings: list[ToppingInput] = []


class ProductOut(ProductBase):
    id: str
    available_toppings: list[ToppingOut] = []
