
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import reports

import app.models  # noqa: F401  — registra todos os models no metadata/registry
from app.core.config import settings
from app.routers import auth, orders, products, reports, staff, tables, tabs, tenant, uploads

Path("static/uploads").mkdir(parents=True, exist_ok=True)

app = FastAPI(title="PizzaShop API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(auth.router)
app.include_router(tenant.router)
app.include_router(products.router)
app.include_router(staff.router)
app.include_router(orders.router)
app.include_router(tables.router)
app.include_router(tabs.router)
app.include_router(uploads.router)
app.include_router(reports.router)


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}
