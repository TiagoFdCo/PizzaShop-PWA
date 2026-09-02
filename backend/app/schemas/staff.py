from app.models.staff import StaffRole
from app.schemas.common import CamelModel


class StaffCreate(CamelModel):
    """Payload para o admin cadastrar um funcionário (cozinheiro/entregador)."""

    name: str
    role: StaffRole
    username: str
    password: str  # texto plano na entrada; vira password_hash antes de salvar


class StaffOut(CamelModel):
    id: str
    name: str
    role: StaffRole
    username: str
    # password_hash NUNCA sai na resposta


class StaffRef(CamelModel):
    """Referência leve embutida em OrderOut.cook / OrderOut.driver."""

    id: str
    name: str


class LoginRequest(CamelModel):
    username: str
    password: str


class LoginResponse(CamelModel):
    access_token: str
    token_type: str = "bearer"
    staff: StaffOut
