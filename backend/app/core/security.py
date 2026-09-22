from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ---------- Senha ----------

def hash_password(plain_password: str) -> str:
    """Gera o hash bcrypt de uma senha em texto plano, para gravar em staff.password_hash."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Confere uma senha em texto plano contra o hash salvo no banco."""
    return pwd_context.verify(plain_password, password_hash)


# ---------- JWT ----------
# O token carrega "sub" (staff id), "role" e "name". O `role` embutido é o que
# permite ao deps.require_role([...]) autorizar sem precisar consultar o banco
# a cada request.

def create_access_token(staff_id: str, role: str, name: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload: dict[str, Any] = {
        "sub": staff_id,
        "role": role,
        "name": name,
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_customer_token(customer_id: str, name: str) -> str:
    """
    Token de CLIENTE (loja pública), separado do de staff. Carrega dois
    claims redundantes de propósito:
      - "role": "customer"  — contrato combinado com o P3 (deps_customer.py),
        que já está em produção lendo esse campo pro cupom/fidelidade.
      - "type": "customer"  — usado por deps.py (get_current_customer),
        pensado antes de saber que o P3 tinha adotado "role".
    Mantemos os dois pra não quebrar nenhum dos dois lados.
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload: dict[str, Any] = {
        "sub": customer_id,
        "role": "customer",
        "type": "customer",
        "name": name,
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any] | None:
    """Retorna o payload decodificado, ou None se o token for inválido/expirado."""
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None
