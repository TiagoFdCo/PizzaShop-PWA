from typing import Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


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
    # Corrigido: por padrão, pydantic-settings tenta decodificar list[str]
    # vindo de env var como JSON. O docker-compose.yml manda uma string
    # simples (ex.: "http://localhost" ou "http://a.com,http://b.com"), o
    # que derrubava a aplicação inteira na subida (`Settings()` roda no
    # import de main.py) com SettingsError — o Uvicorn nem chegava a abrir
    # a porta, por isso o healthcheck do backend nunca ficava "healthy".
    # `NoDecode` pula a tentativa de JSON e deixa o parsing pro validator.
    CORS_ORIGINS: Annotated[list[str], NoDecode] = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _split_cors_origins(cls, value):
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


settings = Settings()
