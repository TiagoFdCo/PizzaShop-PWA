from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import auth, orders, products, staff, tenant

app = FastAPI(title="PizzaShop API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(tenant.router)
app.include_router(products.router)
app.include_router(staff.router)
app.include_router(orders.router)  # rotas ainda vazias — ver TODO(P2) em app/routers/orders.py


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}
