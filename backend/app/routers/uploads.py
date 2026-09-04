import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, status

from app.deps import require_role
from app.models.staff import StaffRole

router = APIRouter(prefix="/uploads", tags=["uploads"])

UPLOAD_DIR = Path("static/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_CONTENT_TYPES = {"image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif"}
MAX_SIZE_BYTES = 2 * 1024 * 1024  # 2MB — mesmo limite já validado no front


@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_image(
    request: Request,
    file: UploadFile,
    _admin=Depends(require_role([StaffRole.admin])),
) -> dict[str, str]:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Tipo de arquivo não suportado"
        )

    contents = await file.read()
    if len(contents) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Arquivo maior que 2MB")

    ext = Path(file.filename or "").suffix or ".png"
    filename = f"{uuid.uuid4().hex}{ext}"
    (UPLOAD_DIR / filename).write_bytes(contents)

    # URL absoluta: o campo é exibido em páginas de origens diferentes (loja,
    # admin), então precisa apontar pro backend, não ser relativa à página atual.
    absolute_url = f"{str(request.base_url).rstrip('/')}/static/uploads/{filename}"
    return {"url": absolute_url}