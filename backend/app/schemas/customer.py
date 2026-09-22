import re

from pydantic import field_validator

from app.core.cpf import is_valid_cpf, normalize_cpf
from app.schemas.common import CamelModel

_NON_DIGITS = re.compile(r"\D")


class CustomerRegister(CamelModel):
    name: str
    phone: str
    cpf: str
    password: str

    # Endereço — rua/bairro/cidade/UF chegam já preenchidos pelo front (via
    # ViaCEP), não digitados à mão. Validamos aqui de novo porque a API é
    # externa e o front pode enviar sem consultar (ex. requisição direta).
    cep: str
    street: str
    number: str
    complement: str | None = None
    neighborhood: str
    city: str
    state: str

    @field_validator("cpf")
    @classmethod
    def _validate_cpf(cls, value: str) -> str:
        if not is_valid_cpf(value):
            raise ValueError("CPF inválido")
        return normalize_cpf(value)

    @field_validator("password")
    @classmethod
    def _validate_password(cls, value: str) -> str:
        if len(value) < 6:
            raise ValueError("Senha deve ter ao menos 6 caracteres")
        return value

    @field_validator("cep")
    @classmethod
    def _validate_cep(cls, value: str) -> str:
        digits = _NON_DIGITS.sub("", value or "")
        if len(digits) != 8:
            raise ValueError("CEP inválido")
        return digits

    @field_validator("state")
    @classmethod
    def _validate_state(cls, value: str) -> str:
        value = (value or "").strip().upper()
        if len(value) != 2:
            raise ValueError("UF inválida")
        return value


class CustomerLogin(CamelModel):
    cpf: str
    password: str

    @field_validator("cpf")
    @classmethod
    def _normalize_login_cpf(cls, value: str) -> str:
        # Login não valida dígitos verificadores de novo (CPF já foi validado
        # no cadastro) — só normaliza, pra aceitar com ou sem máscara.
        return normalize_cpf(value)


class CustomerOut(CamelModel):
    id: str
    name: str
    phone: str
    cpf: str
    cep: str
    street: str
    number: str
    complement: str | None = None
    neighborhood: str
    city: str
    state: str
    # password_hash NUNCA sai na resposta


class CustomerLoginResponse(CamelModel):
    access_token: str
    token_type: str = "bearer"
    customer: CustomerOut
