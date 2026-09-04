# PizzaShop PWA

E-commerce white-label de pizzas (React + TypeScript + Vite) com loja,
carrinho, checkout, acompanhamento de pedido em tempo real e painéis de
administrador, cozinha e entregador. O backend é uma API real em
**FastAPI + PostgreSQL** (pasta `backend/`).

## Como rodar

### 1. Backend (API + banco)

```bash
cd backend
docker-compose up --build          # sobe Postgres + API já migrada em http://localhost:8000
docker-compose exec api python -m scripts.seed   # popula cardápio, tenant e usuários padrão
```

Swagger interativo: `http://localhost:8000/docs`. Detalhes e execução sem
Docker em `backend/README.md`.

### 2. Frontend

```bash
npm install
cp .env.example .env    # define VITE_API_URL=http://localhost:8000
npm run dev
```

Abra o endereço exibido pelo Vite (`http://localhost:5173`).

> O `json-server` (`npm run mock-api`) permanece disponível como fallback de
> desenvolvimento, mas o app fala com o backend FastAPI por padrão. Aponte
> `VITE_API_URL` conforme o modo desejado (ver `.env.example`).

## Acessos (criados pelo seed)

| Papel      | Rota        | Usuário   | Senha        |
|------------|-------------|-----------|--------------|
| Admin      | `/admin`    | `admin`   | `admin123`   |
| Cozinha    | `/cozinha`  | `cozinha` | `cozinha123` |
| Entregador | `/entrega`  | `entrega` | `entrega123` |

Loja (cliente, sem login): `/`, `/cardapio`, `/produto/:id`, `/carrinho`,
`/checkout`, `/pagamento`, `/pedido/:id`.

## Verificações

```bash
npm run lint
npm run build     # tsc -b && vite build
npm test          # Vitest + Testing Library
```

## PWA

Instalável (manifest + service worker via `vite-plugin-pwa`), com cache
`StaleWhileRevalidate` de cardápio e configuração da loja. O service worker
só é registrado no build de produção: `npm run build && npm run preview`.
