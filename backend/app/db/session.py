from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    Dependency do FastAPI: abre uma sessão por request e garante o fechamento
    mesmo se a rota lançar exceção. Uso: `db: Session = Depends(get_db)`.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
