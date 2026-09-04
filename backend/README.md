# PizzaShop API (backend/)

Backend real em **FastAPI + PostgreSQL**, substituindo o `json-server`
(`db.json`) usado até agora pelo front. Entrega de **P1** (modelagem &
core): models, schemas, migrations, hash de senha + JWT e o
`docker-compose.yml`. Ver `app/routers/orders.py` e `app/crud/order.py`
para os TODOs que ficam com **P2** (domínio de pedidos).

## Rodando com Docker (recomendado — ninguém precisa instalar Postgres local)

```bash
cd backend
docker-compose up --build
```

Isso sobe Postgres + a API, já rodando as migrations (`alembic upgrade head`)
antes de iniciar o Uvicorn. A API fica em `http://localhost:8000`, com
Swagger interativo em `http://localhost:8000/docs`.

Depois, popule o banco com o cardápio e tenant que já existem no `db.json`:

```bash
docker-compose exec api python -m scripts.seed
```

Isso cria também um usuário admin padrão: `admin` / `admin123` (troque depois).
O script é idempotente — pode rodar de novo sem duplicar dado.

## Rodando local sem Docker

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # ajuste DATABASE_URL se seu Postgres não for local
alembic upgrade head
python -m scripts.seed
uvicorn app.main:app --reload
```

## Estrutura

```
backend/app/
├── main.py            # cria o FastAPI app, CORS, inclui os routers
├── core/
│   ├── config.py       # Settings via pydantic-settings (.env)
│   └── security.py     # hash de senha (bcrypt) + criação/validação de JWT
├── db/
│   ├── base.py          # Base declarativa do SQLAlchemy
│   └── session.py        # engine + SessionLocal + get_db
├── models/              # SQLAlchemy ORM (tenant, staff, product, order, ...)
├── schemas/              # Pydantic — JSON em camelCase (bate com types/*.ts do front)
├── crud/                  # acesso a dado por cima do ORM
├── routers/               # endpoints por recurso
└── deps.py                # get_current_staff, require_role([...])
```

## O que já funciona

- `POST /auth/login` — devolve JWT com `role` embutido
- `GET/PUT /tenant`
- `GET/POST/PUT/DELETE /products`
- `GET/POST /staff` (admin cadastra cozinheiros/entregadores; `GET
  /staff?role=entrega` é o que a cozinha usa pro seletor de entregador)
- `GET /health`

## O que falta (P2)

`app/routers/orders.py` e `app/crud/order.py` estão com TODOs detalhados —
é a lógica de `claim/ready/dispatch/delivered/failed` do pedido. Os models e
schemas de `Order` já estão prontos; só falta a camada de rota/crud por cima.

## Notas importantes pra quem for mexer aqui

- **JSON em camelCase**: os schemas Pydantic (`CamelModel`) convertem
  automaticamente `snake_case` (Python) ↔ `camelCase` (JSON), pra bater com
  os tipos que o front já usa (`types/*.ts`). Não precisa re-mapear nada na
  integração.
- **`OrderOut` não sai de `model_validate(order)` direto** — `customer` é
  aninhado no schema mas achatado no ORM (`customer_name/address/phone`), e
  `cook`/`driver` precisam virar `StaffRef`. Tem um exemplo pronto no
  docstring de `OrderOut` em `app/schemas/order.py`.
- **Autorização é sempre no backend** (`deps.require_role([...])`) — o
  front só esconde/mostra UI, nunca é ele quem garante que um entregador não
  bata num endpoint de cozinha.
- A migration inicial (`alembic/versions/202608310001_schema_inicial.py`)
  foi escrita à mão (sem Postgres disponível neste ambiente pra rodar
  autogenerate) — antes de dar como certa, rode `alembic upgrade head`
  contra um Postgres local de verdade e confira se bate com os models.
