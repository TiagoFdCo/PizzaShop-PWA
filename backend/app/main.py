
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import reports

from app.core.config import settings
from app.routers import auth, expenses, orders, products, reports, staff, tables, tabs, tenant, uploads


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
app.include_router(uploads.router)
app.include_router(reports.router)    # ← Issue #75: relatórios financeiros + Excel
app.include_router(tables.router)     # ← Issue #70: mesas (presencial)
app.include_router(tabs.router)       # ← Issue #70: comandas (presencial)
app.include_router(expenses.router)   # ← Financeiro: despesas administrativas


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}
