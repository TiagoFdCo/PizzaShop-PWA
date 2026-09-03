from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.staff import Staff, StaffRole

# tokenUrl é só documentação pro Swagger (/docs) — o login de verdade é feito
# via POST /auth/login (JSON), não form-encoded.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_current_staff(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Staff:
    """Decodifica o JWT do header Authorization e carrega o Staff correspondente."""
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas ou expiradas",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_error

    staff_id = payload.get("sub")
    if staff_id is None:
        raise credentials_error

    staff = db.get(Staff, staff_id)
    if staff is None:
        raise credentials_error

    return staff


def require_role(allowed_roles: list[StaffRole]):
    """
    Dependency factory: uso `Depends(require_role([StaffRole.cozinha]))` numa
    rota pra exigir um papel específico. A autorização de verdade mora aqui,
    no backend — o front só esconde/mostra UI, não protege nada sozinho.
    """

    def checker(staff: Staff = Depends(get_current_staff)) -> Staff:
        if staff.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Este endpoint exige papel: {', '.join(r.value for r in allowed_roles)}",
            )
        return staff

    return checker
