from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Configurações da aplicação, carregadas de variáveis de ambiente (ou de um
    arquivo .env na raiz de backend/). Nunca hardcode segredos aqui — este
    arquivo só define nomes, tipos e defaults de desenvolvimento.
    """

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Banco de dados
    DATABASE_URL: str = "postgresql+psycopg2://pizzashop:pizzashop@localhost:5432/pizzashop"

    # JWT
    JWT_SECRET: str = "dev-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 480  # 8h — cobre um turno de trabalho da cozinha/entrega

    # CORS — origem do front (Vite dev server / build hospedado)
    CORS_ORIGINS: list[str] = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    ]


settings = Settings()
