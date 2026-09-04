from app.schemas.common import CamelModel


class TenantBase(CamelModel):
    name: str
    tagline: str = ""
    about_text: str = ""
    logo_url: str = ""
    banner_url: str = ""
    primary_color: str = "#c0392b"
    secondary_color: str = "#272b33"
    address: str = ""
    opening_hours: str = ""
    whatsapp: str = ""
    instagram: str = ""
    delivery_fee: float = 0
    delivery_radius_km: float = 0
    avg_prep_time_min: int = 30
    min_order_value: float = 0
    enabled_payment_methods: list[str] = []


class TenantUpdate(TenantBase):
    """Payload de PUT /tenant — todos os campos reenviados (edição via admin)."""

    pass


class TenantOut(TenantBase):
    id: str
