"""Fase 4 (P3) — identificação do CLIENTE logado a partir do JWT.

Por que um arquivo separado (e não dentro de deps.py)?
  O P1 (Tiago) é quem cria o login de cliente e provavelmente vai adicionar
  um `get_current_customer` em deps.py. Pra não dar conflito de merge, o P3
  lê o token aqui, de forma independente, e só precisa do `customer_id`.

Contrato assumido com o P1 (combinar na issue da API de cliente):
  o token de cliente é gerado com o mesmo create_access_token/JWT_SECRET do
  staff, com  sub = customer.id  e  role = "customer"  (aceito também
  "cliente"). Se o P1 escolher outro valor de `role`, basta ajustar
  CUSTOMER_ROLES abaixo — é a única linha que depende dele.

Token de staff (admin/cozinha/...) é ignorado: não conta como cliente.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.security import decode_access_token

CUSTOMER_ROLES = {"customer", "cliente"}

# auto_error=False: rota continua funcionando sem token (checkout anônimo).
_optional_bearer = OAuth2PasswordBearer(tokenUrl="auth/customer/login", auto_error=False)


def get_optional_customer_id(token: str | None = Depends(_optional_bearer)) -> str | None:
    """customer_id se houver token de cliente válido; None caso contrário."""
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload or payload.get("role") not in CUSTOMER_ROLES:
        return None
    sub = payload.get("sub")
    return str(sub) if sub else None


def get_required_customer_id(customer_id: str | None = Depends(get_optional_customer_id)) -> str:
    if customer_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Faça login como cliente para acessar a fidelidade",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return customer_id
