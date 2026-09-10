from app.schemas.common import CamelModel


class ProductRecommendationOut(CamelModel):
    """Um produto recomendado — dados mínimos pra exibir um card, sem
    precisar do payload completo de ProductOut (sem toppings, sem
    available_sizes)."""

    id: str
    name: str
    image_url: str
    base_price: float