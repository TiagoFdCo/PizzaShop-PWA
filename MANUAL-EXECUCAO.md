# Manual de execução — PizzaShop PWA

Este manual reflete o estado **corrigido** do projeto (ver `CORRECOES.md`
para o histórico completo dos bugs encontrados e resolvidos).

## Pré-requisitos

- Docker + Docker Compose
- Node.js 20+ (só se for rodar o front em modo dev fora do Docker)

## 1. Subir backend + banco (Docker)

O `docker-compose.yml` fica na **raiz do repositório** (não em `backend/`).

```bash
docker-compose up --build --detach
```

Isso sobe três serviços: `db` (Postgres), `backend` (API FastAPI) e
`frontend` (build de produção servido por Nginx, porta 80).

Confirme que todos os containers estão saudáveis:

```bash
docker-compose ps
```

Esperado: `db-1` e `backend-1` como `Up (healthy)`, `frontend-1` como `Up`.
Se `backend-1` não ficar `healthy`, veja o log antes de continuar:

```bash
docker-compose logs backend --tail 50
```

## 2. Rodar as migrations

**Não acontece sozinho** — é um passo manual:

```bash
docker-compose exec backend alembic upgrade head
```

## 3. Popular o banco (seed)

```bash
docker-compose exec backend python -m scripts.seed
```

Idempotente — pode rodar de novo sem duplicar dado. Cria:
- o tenant e o cardápio (a partir de `db.json`), com custo estimado por
  produto quando o `db.json` não informa um;
- os 4 usuários padrão (tabela abaixo);
- 6 mesas de demonstração (`/garcom/mesas`);
- 6 despesas de demonstração (`/admin/financeiro`), com datas relativas a
  hoje pra sempre caírem no mês corrente.

## 4. Acessar

| O quê | URL |
|---|---|
| Frontend (produção, via Docker) | `http://localhost` |
| API | `http://localhost:8000` |
| Swagger da API | `http://localhost:8000/docs` |
| Healthcheck | `http://localhost:8000/health` → `{"status":"ok"}` |

## 5. Logins criados pelo seed

| Papel | Rota após login | Usuário | Senha |
|---|---|---|---|
| Admin | `/admin/dashboard` | `admin` | `admin123` |
| Cozinha | `/cozinha/pedidos` | `cozinha` | `cozinha123` |
| Entregador | `/entrega` | `entrega` | `entrega123` |
| Garçom | `/garcom/mesas` | `garcom` | `garcom123` |

Login é sempre pela mesma tela (`/admin`), independente do papel — o
sistema redireciona sozinho depois de autenticar.

## 6. Alternativa: frontend em modo dev (hot reload)

Só se quiser editar o front sem rebuildar a imagem Docker a cada mudança.
O backend continua rodando no Docker (porta 8000) — os dois coexistem, é
o mesmo banco por trás.

```bash
npm install
cp .env.example .env    # confere VITE_API_URL=http://localhost:8000
npm run dev
```

Abra `http://localhost:5173`.

## 7. Verificações (antes de dar como pronto)

```bash
# Backend
docker-compose exec backend python -m pytest -q     # ou fora do container, com DATABASE_URL apontando pro Postgres do compose

# Frontend
npm run lint
npx tsc --noEmit -p tsconfig.app.json
npm test              # Vitest
npm run build          # tsc -b && vite build
```

## Problemas já vistos e resolvidos (se aparecerem de novo, é regressão)

- **`backend-1` nunca fica `healthy`** → geralmente é `Settings()` explodindo
  no import de `main.py` por uma variável de ambiente mal formatada
  (aconteceu com `CORS_ORIGINS`, já corrigido). Ver `docker-compose logs
  backend`.
- **Login não leva a lugar nenhum / volta pra tela de login** → papel sem
  redirecionamento tratado em `LoginPage.tsx` (aconteceu com `garcom`, já
  corrigido).
- **`docker-compose build` falha no serviço `frontend`** → contexto de build
  errado (`docker-compose.yml` apontava pra uma pasta `frontend/` que não
  existe; já corrigido para `context: .` + `Dockerfile.frontend`).
