# Mudanças feitas — PizzaShop PWA

Este documento reúne **tudo** que foi alterado neste pacote em relação ao
que existia antes: primeiro um resumo por categoria, depois uma referência
arquivo por arquivo (o que cada arquivo novo faz e por quê). Para o
raciocínio/diagnóstico completo de cada bug, ver `CORRECOES.md`; para o
passo a passo de execução, ver `MANUAL-EXECUCAO.md`.

---

## 1. Resumo por categoria

### 1.1 Integração (as duas frentes de trabalho nunca tinham se encontrado)
- Backend de mesas/comandas (`/tables`, `/tabs`) trazido do branch local pro
  branch com avaliação/recomendação/painel do garçom (que vinham do GitHub).
- `main.py` passou a registrar `tables.router` e `tabs.router` (existiam,
  nunca tinham sido ligados).

### 1.2 Bugs de dados e regras de negócio
- `crud/report.py`: financeiro agora calcula custo real (soma de
  `OrderItem.cost`) e nota real (join com `order_rating`) em vez de somar
  colunas que não existem — antes caía sempre no mock.
- `OrderOut` ganhou `channel` e `tabId` — antes todo pedido aparecia como
  `delivery` fora da tela da comanda.
- `dispatch_order` agora recusa despachar pedido presencial pra um
  entregador (bug: comanda aparecia no perfil do entregador).
- `mark_served` / `PATCH /orders/{id}/serve`: novo jeito de um pedido de
  mesa chegar a "entregue" sem passar por entregador.
- Comanda aberta ficava inacessível depois de sair da tela — `GET /tabs`
  ganhou filtro por `tableId`, mesa ocupada agora tem botão "Ver comanda".
- Histórico de comandas por mesa (a relação 1 mesa : N comandas não tinha
  nenhuma tela) — nova página `TableHistoryPage`.

### 1.3 Bugs de configuração/infraestrutura
- `CORS_ORIGINS` derrubava o backend inteiro na subida (pydantic-settings
  tentava decodificar como JSON) — corrigido com `NoDecode` + validator.
- `docker-compose.yml` apontava o build do frontend pra uma pasta que não
  existe — corrigido `context`/`dockerfile`.
- `docker-compose.yml` definia `SECRET_KEY`, mas o código só lê
  `JWT_SECRET` — valor configurado era sempre ignorado.
- Download de Excel/PDF sempre saía sem token de autenticação (lia uma
  chave errada do `localStorage`) — sempre voltava 401.
- `tableService.ts` chamava a API mock (json-server) em vez da API real.
- `LoginPage.tsx` não sabia redirecionar o papel `garcom` — ficava preso na
  tela de login.

### 1.4 Funcionalidades novas
- **Despesas administrativas** (Financeiro): modelo, migration, CRUD,
  endpoints (`/expenses`) e tela com cadastro/exclusão, persistidas no
  Postgres (a versão original usava `localStorage`).
- **Painel BI**: dois gráficos (`recharts`) em `/admin/financeiro` —
  receita x despesas por mês, vendas por canal.
- **Relatório em PDF**: `GET /reports/export.pdf`, nunca tinha existido.
- **Seed** ampliado: usuário garçom, 6 mesas, 6 despesas e custo estimado
  por produto — antes só criava usuários e cardápio.

---

## 2. Arquivos novos — o que cada um faz

### Backend

| Arquivo | O que faz |
|---|---|
| `backend/app/crud/table.py` | Regras de negócio de mesas e comandas: abrir mesa, abrir/listar/fechar/pagar comanda, lançar itens. Trava "só uma comanda aberta por mesa" e libera a mesa quando não sobra comanda ativa. |
| `backend/app/routers/tables.py` | Endpoints `GET/POST /tables`, `PATCH /tables/{id}/status`. |
| `backend/app/routers/tabs.py` | Endpoints `POST /tabs`, `GET /tabs` (com filtro por `status` e `tableId`), `GET /tabs/{id}`, `POST /tabs/{id}/orders`, `PATCH /tabs/{id}/close`, `PATCH /tabs/{id}/pay`. |
| `backend/app/schemas/table.py` | Schemas Pydantic de mesa/comanda (`TableInput/Out`, `TabInput/Out`, etc.), em camelCase pro front. |
| `backend/app/models/expense.py` | Model `Expense` (despesa administrativa) + enum `ExpenseCategory` (aluguel, energia, ingredientes, etc.). |
| `backend/app/schemas/expense.py` | `ExpenseInput`/`ExpenseOut`. |
| `backend/app/crud/expense.py` | `list_expenses`, `create_expense`, `delete_expense`, tudo isolado por `tenant_id`. |
| `backend/app/routers/expenses.py` | Endpoints `GET/POST /expenses`, `DELETE /expenses/{id}` — só admin. |
| `backend/alembic/versions/202609110001_financeiro_despesas.py` | Migration que cria a tabela `expense` e o enum `expense_category` no Postgres. |

### Frontend

| Arquivo | O que faz |
|---|---|
| `src/pages/garcom/TableHistoryPage.tsx` | Tela em `/garcom/mesas/:tableId/historico` — lista todas as comandas (abertas, fechadas, pagas) já feitas numa mesa, com data e total; clicar abre a comanda (em modo leitura se já estiver fechada/paga). |
| `src/types/finance.ts` | Tipos `Expense`, `ExpenseCategory` e os rótulos em português de cada categoria — usados pela tela e pelo serviço de despesas. |
| `src/services/financeService.ts` | `getExpenses`, `createExpense`, `deleteExpense` — chama `/expenses` no backend (a versão original salvava em `localStorage`, sem persistência real). |

### Raiz do projeto

| Arquivo | O que faz |
|---|---|
| `docker-compose.yml` | Sobe `db` (Postgres), `backend` (FastAPI) e `frontend` (Nginx com o build do Vite) juntos. |
| `Dockerfile.frontend` | Build multi-stage do frontend: `npm run build` e depois serve o `dist/` via Nginx. |
| `nginx.conf` | Config do Nginx do frontend: cache longo pros assets com hash, todo o resto cai em `index.html` (SPA). |
| `CORRECOES.md` | Histórico completo de tudo que foi encontrado e corrigido, com o raciocínio por trás de cada correção. |
| `MANUAL-EXECUCAO.md` | Passo a passo pra subir o projeto do zero (Docker, migrations, seed) e uma lista de "problemas já vistos" pra não reabrir investigação se algo já resolvido reaparecer. |

---

## 3. Arquivos existentes com mudança significativa

### Backend
- **`main.py`** — registra `tables`, `tabs` e `expenses` (routers que existiam ou foram criados mas nunca tinham sido ligados).
- **`core/config.py`** — `CORS_ORIGINS` com `Annotated[list[str], NoDecode]` + validator, pra aceitar string simples ou separada por vírgula vinda de variável de ambiente sem quebrar a subida do servidor.
- **`crud/report.py`** — reescrito: custo real via subquery em `OrderItem`, nota real via join com `OrderRating`, breakdown de staff agora cobre entregador *e* garçom.
- **`crud/order.py`** — `dispatch_order` recusa canal não-delivery; nova função `mark_served`.
- **`routers/orders.py`** — `_order_to_out` inclui `channel`/`tab_id`; novo endpoint `PATCH /{id}/serve`.
- **`routers/reports.py`** — novo endpoint `GET /export.pdf` (builder com `reportlab`, mesma estrutura de dados do Excel).
- **`schemas/order.py`** — `OrderOut` ganhou `channel` e `tab_id`.
- **`models/__init__.py`** — exporta `Expense`/`ExpenseCategory`.
- **`scripts/seed.py`** — cria usuário garçom, 6 mesas, 6 despesas de demonstração, e estima custo dos produtos (40% do preço) quando o `db.json` não informa um.
- **`requirements.txt`** — `reportlab` adicionado.
- **`.env.example` / `README.md` (backend)** — documentação atualizada com as rotas novas e o passo a passo real de execução.

### Frontend
- **`services/api.ts`** — nova função `getAuthToken()`, fonte única de verdade pro token (usada agora também pelos downloads binários).
- **`services/reportService.ts`** — `downloadBinaryReport` usa `getAuthToken()` em vez de reler `localStorage` com chave errada; nova função `downloadReportPdf`.
- **`services/tableService.ts`** — usa a API real (`/tables`) em vez do mock; corrige a rota de status.
- **`services/tabService.ts`** — nova função `listTabs` (com filtro por `status`/`tableId`).
- **`services/kitchenService.ts`** — nova função `markOrderServed`.
- **`pages/admin/LoginPage.tsx`** — redireciona `garcom` pra `/garcom`.
- **`pages/admin/BiDashboardPage.tsx`** — reescrita: KPIs de receita/despesa/saldo, extrato, cadastro de despesa, dois gráficos (`recharts`), exportação Excel e PDF.
- **`pages/garcom/TablesPage.tsx`** — busca as comandas abertas junto com as mesas; mesa ocupada mostra "Ver comanda"; todo card tem link pro histórico.
- **`pages/kitchen/KitchenOrdersPage.tsx`** — novo handler `onServe` (pedido de mesa pronto → servido).
- **`components/kitchen/KitchenOrderCard.tsx`** — ramifica por `order.channel`: comanda mostra "Servir na mesa", delivery mostra o formulário de entregador (antes mostrava o formulário de entregador pra qualquer canal).
- **`components/garcom/TableCard.tsx`** — botão "Ver comanda" pra mesa ocupada (antes mesa ocupada não tinha nenhum botão); link de histórico em todo card.
- **`components/admin/OrdersTable.tsx`** — coluna "Canal" (Delivery/Presencial).
- **`components/layout/AdminLayout.tsx`** — item de menu "Financeiro" (existia o componente, faltava o link).
- **`router.tsx`** — rotas `/admin/financeiro` e `/garcom/mesas/:tableId/historico`.
- **`types/order.ts`** — `Order` ganhou `channel`/`tabId`; `StaffRole` local (duplicado) ganhou `garcom`.
- **`types/table.ts`** — `TableStatus` ganhou `reservada`.
- **`package.json`** — `recharts` (usado pelos gráficos do painel BI).

---

## 4. O que ainda não foi feito (ver `CORRECOES.md`, seção 3, pra detalhes)
- Teste automatizado do fluxo presencial completo (abrir mesa → comanda → fechar → pagar).
- Tela de admin pra cadastrar garçom/cozinheiro (hoje só via seed ou API direta).
- Recomendação ainda é "mais vendidos", não "costuma ser pedido junto" de verdade.
