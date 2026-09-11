# Diagnóstico e correções — PizzaShop PWA

Este pacote parte do `origin/main` (mais atualizado, com os PRs #82/#83/#84 já
mesclados) e resolve a divergência com o checkout local que estava parado num
merge conflitante. Resumo do que foi encontrado e corrigido.

## 1. Causa raiz: duas frentes de trabalho nunca integradas

- O checkout local (`feat/integracao-sistema`) estava **parado no meio de um
  merge com conflito não resolvido** em `.gitignore`, 12 commits atrás do
  `origin/main`.
- O backend de mesas/comandas (models, CRUD, routers de `/tables` e `/tabs`)
  só existia localmente, feito nas branches `69-fundacao-de-dados-fase-3` e
  `70-crud-mesas-e-comandas`.
- O frontend do garçom, o widget de avaliação e a recomendação só existiam no
  `origin/main`, vindos das branches `71`, `72` e `73` (já mescladas por PR).
- Resultado: nenhuma das duas máquinas sozinha tinha o sistema completo.

## 2. Bugs corrigidos

1. **`backend/app/main.py`** não registrava `tables.router` nem `tabs.router`.
   Todo o código de mesas/comandas existia mas devolvia 404 na prática.
2. **`backend/app/crud/report.py`** somava `Order.cost_snapshot` (coluna que
   não existe — custo é por item, `OrderItem.cost`) e tirava média de
   `Order.rating` como se fosse número (é um relacionamento com
   `order_rating`). Isso fazia a consulta real estourar exceção e o
   financeiro cair **sempre** no mock, além de o endpoint `/reports/ledger`
   quebrar com `TypeError` quando algum pedido tinha avaliação. Reescrito
   para calcular custo e nota reais via subquery/join.
3. **`backend/app/schemas/order.py` / `routers/orders.py`** — `OrderOut` não
   tinha os campos `channel` nem `tabId`. `GET /orders` e `GET /orders/{id}`
   (usados por admin, cozinha, entrega e rastreamento) sempre mostravam
   `channel: "delivery"`, mesmo para pedidos de mesa. Adicionados os campos
   no schema, no `_order_to_out`, no tipo `Order` do front e uma coluna
   "Canal" na tabela de pedidos do admin.
4. **`src/services/tableService.ts`** ainda chamava a API mock (json-server)
   com o comentário "até o P2 terminar os endpoints reais" — os endpoints
   reais já existem há tempo. Trocado para a API real, e corrigida a rota de
   `PATCH /tables/{id}` para `PATCH /tables/{id}/status` (a rota real).
5. **`BiDashboardPage.tsx`** (KPIs + gráficos + Excel) existia pronta, com um
   comentário do próprio autor pedindo para "adicionar em router.tsx e no
   NAV_ITEMS" — nunca foi feito. Roteada em `/admin/financeiro` e adicionada
   ao menu.
6. **`package.json`** não declarava `recharts`, usado pelos componentes do
   painel BI — `npm install` do zero quebraria o build. Adicionado.
7. **`backend/scripts/seed.py`**:
   - não criava nenhum usuário com papel garçom (ninguém conseguia logar em
     `/garcom`);
   - não criava nenhuma mesa (o painel do garçom sempre nascia vazio);
   - não definia custo (`cost`) dos produtos — todo produto seedado nascia
     com `cost = 0`, então o financeiro sempre mostrava lucro = faturamento.
   Corrigido: garçom padrão (`garcom` / `garcom123`), 6 mesas de exemplo, e
   custo estimado em 40% do preço de venda quando o `db.json` não informa um.

8. **`docker-compose.yml`** — o serviço `frontend` apontava `build.context`
   para `./frontend` (pasta que não existe — o front fica na raiz do repo,
   com `Dockerfile.frontend`). `docker-compose up` quebraria na hora de
   buildar. Corrigido para `context: .` / `dockerfile: Dockerfile.frontend`.
9. **`README.md` e `backend/README.md` estavam desatualizados**: mandavam
   rodar `docker-compose` de dentro de `backend/` (o arquivo está na raiz),
   citavam um serviço `api` (o nome real é `backend`), afirmavam que as
   migrations rodavam sozinhas (não rodam — precisa `alembic upgrade head`
   manual) e a seção "O que falta (P2)" ainda falava da fase de pedidos, que
   já está pronta há tempo. Reescritos com o passo a passo real e a lista
   atual do que falta.
10. **`backend/app/core/config.py` — bug que derrubava o container inteiro.**
   `CORS_ORIGINS` é `list[str]`; por padrão o pydantic-settings tenta ler
   isso de env var como **JSON**. O `docker-compose.yml` manda uma string
   simples (`CORS_ORIGINS=http://localhost`), então `Settings()` — que roda
   no `import` de `main.py` — estourava `SettingsError` antes do Uvicorn
   sequer abrir a porta 8000. Resultado exatamente como no seu log: o
   container do backend nunca ficava "healthy" e o frontend (que depende
   dele) ficava parado em "Created". Corrigido com `Annotated[list[str],
   NoDecode]` + um validator que aceita string única ou lista separada por
   vírgula. Também corrigi o `docker-compose.yml`, que definia a variável
   `SECRET_KEY` — o código só lê `JWT_SECRET`, então o valor configurado
   sempre era ignorado silenciosamente e o app caía no default de
   desenvolvimento.

11. **`LoginPage.tsx` não sabia redirecionar o garçom.** O `onSubmit` só
   tratava `cozinha` e `entrega`; qualquer outro papel (inclusive `garcom`)
   caía no `else` e navegava pra `/admin/dashboard`, que exige papel
   `admin` — o `ProtectedRoute` barrava e devolvia pro login. Era exatamente
   o sintoma "logo como garçom e continua na tela de login". Adicionado o
   caso `role === "garcom"` → `/garcom`. De quebra, `types/order.ts` tinha
   uma segunda definição de `StaffRole` (duplicada da de `types/staff.ts`)
   também sem `"garcom"` — corrigida.

```bash
# Backend + banco (compose fica na raiz do repo)
docker-compose up --build --detach
docker-compose exec backend alembic upgrade head
docker-compose exec backend python -m scripts.seed

# Frontend
npm install
cp .env.example .env    # VITE_API_URL=http://localhost:8000
npm run dev
```

Acessos criados pelo seed: `admin`/`admin123`, `cozinha`/`cozinha123`,
`entrega`/`entrega123`, `garcom`/`garcom123` — mais 6 mesas de demonstração.

## 5. Financeiro com despesas persistidas (trazido de `PizzaShop-PWA-Financeiro-v2.zip`)

Um integrante tinha feito localmente uma versão nova da tela `/admin/financeiro`
(despesas administrativas: aluguel, energia, ingredientes, etc.) e nunca
enviou pro GitHub — o zip continha só essa página, sozinha, baseada numa
cópia do projeto **anterior a todas as correções acima** (voltava a ter os
bugs do `CORS_ORIGINS`, do login do garçom, do `/tables`/`/tabs` não
registrados, etc.). Trouxe só a parte nova (despesas), por cima do projeto
já corrigido, e persisti no Postgres em vez de `localStorage` (que era como
a pessoa tinha feito — some ao limpar o navegador, não compartilha entre
usuários):

- **Backend novo**: model `Expense` (`backend/app/models/expense.py`),
  migration `202609110001_financeiro_despesas` (tabela `expense` +
  enum `expense_category`), schema, CRUD e router `/expenses`
  (`GET`/`POST`/`DELETE`, só admin) — registrado em `main.py`.
- **Frontend**: `financeService.ts` reescrito pra chamar `/expenses` em vez
  de `localStorage`; `types/finance.ts` trazido como estava (já batia
  exatamente com as categorias do backend). `BiDashboardPage.tsx` (rota
  `/admin/financeiro`) trocada pela versão nova: calcula **receita das
  vendas entregues − despesas do período = lucro/saldo líquido**, com
  extrato, cadastro de despesa (modal) e exportação (Excel real via
  `/reports/export.xlsx`, com fallback pra CSV gerado no navegador se a
  exportação falhar).
- **Limpeza**: como a página nova não usa mais os gráficos antigos
  (`KpiCard`/`RevenueBarChart`/`StaffDonutChart`, que dependiam de
  `recharts`), removi os três arquivos e a dependência `recharts` do
  `package.json` — o chunk da página caiu de ~400KB pra ~14KB no build.
- **Ajuste de compatibilidade**: a página usava `String.prototype.replaceAll`
  (ES2021); o `tsconfig.app.json` do projeto mira ES2020 — troquei por
  `split/join` equivalente pra não precisar mexer no target do projeto todo.
- **Seed**: `scripts/seed.py` agora cria 6 despesas de demonstração também
  (datas relativas a hoje, sempre caem no mês corrente), então a tela de
  Financeiro já nasce com dado real pra mostrar.

**Nota de modelagem, pra não confundir o time**: esse "lucro" (receita das
vendas − despesas administrativas lançadas à mão) é um conceito **diferente**
do "lucro bruto" que já existia em `/reports/summary` (receita − custo dos
ingredientes por pedido, via `OrderItem.cost` congelado — ver seção 2, item
2). Os dois continuam existindo e não se sobrepõem automaticamente: se o
admin lançar "compra de queijo" como despesa E o produto já tiver custo de
ingrediente configurado, o queijo conta nos dois lugares com propósitos
diferentes (COGS por pedido vs. fluxo de caixa do mês). Vale alinhar com o
time qual dos dois é "o" lucro pra apresentação de sexta, ou deixar claro que
são métricas complementares.

## 6. Painel BI (gráficos) e relatório em PDF

Na sessão anterior, ao trocar `/admin/financeiro` pela versão com despesas
(seção 5), os dois gráficos que existiam ali (`recharts`) saíram sem
substituto — o roteiro pedia explicitamente "painel visual com 2–3
gráficos" como parte do requisito de Relatórios, e PDF nunca tinha sido
implementado em nenhuma branch. Fechando os dois:

- **Gráfico 1 — Receita x despesas por mês**: barras agrupadas, últimos 6
  meses com movimento (soma de pedidos entregues + despesas lançadas),
  independente do filtro de período da tela — dá visão de tendência mesmo
  filtrando um mês específico nos cards/tabela.
- **Gráfico 2 — Vendas por canal**: donut delivery x presencial, respeitando
  o filtro de período selecionado (reaproveita `order.channel`).
- Os dois ficam em `/admin/financeiro`, entre os cards de KPI e o extrato —
  `recharts` voltou ao `package.json` (tinha sido removido quando os
  gráficos antigos saíram).
- **PDF**: `GET /reports/export.pdf`, gerado no servidor com `reportlab`
  (adicionado ao `requirements.txt`). Mesmo conteúdo do Excel — indicadores
  gerais, por canal, por staff, lista de pedidos — em landscape A4, com
  cabeçalho de tabela repetido a cada página. Botão "PDF" ao lado do
  "Excel" no cabeçalho da tela. Testado gerando o PDF de verdade (com dados
  mock e com dados vazios) e inspecionando visualmente a primeira página.

## 7. Três bugs reportados pelo time (fluxo do garçom)

### 6.1 Comanda ficava inacessível depois de sair da tela

`TableCard.tsx` só tinha botão pra mesa **livre** ("Abrir comanda"). Mesa
**ocupada** não tinha nenhum botão — não tinha como voltar pra comanda já
aberta depois de navegar pra outro lugar, então também não dava pra
cancelar/fechar/pagar. Corrigido:
- `GET /tabs` agora aceita `tableId` (além do `status` que já existia), pra
  buscar a comanda aberta de uma mesa específica.
- `TablesPage.tsx` busca as comandas abertas junto com as mesas e monta um
  mapa mesa → comanda; mesa ocupada agora mostra "Ver comanda", que navega
  direto pra ela.

### 6.2 Pedido de mesa aparecia no perfil do entregador

Causa real: `KitchenOrderCard.tsx` mostrava o formulário "enviar pra
entrega" (que atribui um `driver_id`) pra **qualquer** pedido em
`pronto_entrega`, sem checar o canal — incluindo comandas do garçom. Uma
vez despachado, o pedido de mesa passava a aparecer nos pedidos do
entregador (`Order.driverId` setado). Corrigido nos dois lados:
- **Backend**: `dispatch_order` agora rejeita (`ValueError`) despachar
  pedido que não seja `delivery` — trava mesmo que alguém tente pela API
  direto, não só escondendo botão na tela.
- Criado `mark_served` / `PATCH /orders/{id}/serve`: equivalente ao
  "entregue" do delivery, mas pra pedido de mesa — sem entregador, cozinha
  ou garçom confirmam. Sem isso não existia NENHUM jeito de uma comanda
  chegar a "entregue" (necessário pro relatório financeiro contar o
  pedido).
- **Frontend**: `KitchenOrderCard.tsx` agora ramifica por
  `order.channel` — pedido de mesa em "pronto" mostra "Servir na mesa"
  (chama `/serve`); delivery continua com o formulário de entregador.

### 6.3 Não dava pra ver o histórico de comandas de uma mesa

A relação "1 mesa : N comandas ao longo do tempo" sempre existiu no banco,
mas não tinha nenhuma tela mostrando isso — só a comanda aberta no momento.
Nova página `TableHistoryPage.tsx` em `/garcom/mesas/:tableId/historico`
(link "Histórico de comandas" em todo card de mesa) lista todas as
comandas já abertas naquela mesa — aberta, fechada ou paga — com data,
total e quantidade de pedidos lançados; clicar numa comanda fechada/paga
abre ela em modo leitura no `TabPage.tsx` (que já tratava `isClosed`).

## 8. 401 no download de Excel/PDF (token nunca era enviado)

O log do backend mostrou `GET /reports/export.pdf HTTP/1.1" 401 Unauthorized`
mesmo com o `reportlab` instalado e o login funcionando (`/auth/login` e
`/orders` respondiam 200 normalmente). Causa: `downloadBinaryReport`
(usada tanto pelo Excel quanto pelo PDF) lia o token do `localStorage` numa
chave/caminho que **nunca existiram de verdade**:
`localStorage.getItem("auth-store")` → `state.token`. O `useAuthStore`
(zustand `persist`) na verdade usa a chave `"pizzashop-staff-auth"` e guarda
o token em `state.session.token`. Resultado: a requisição sempre saía sem
`Authorization`, então sempre voltava 401 — em qualquer navegador, sempre,
mesmo logado. Isso é anterior a esta conversa (já vinha assim desde antes
das correções), só nunca tinha sido exercitado de ponta a ponta com o
backend real rodando.

Corrigido usando a mesma fonte de verdade que o resto da API já usa:
adicionei `getAuthToken()` em `api.ts` (par de `setAuthToken`, que o
`useAuthStore` já chama no login/rehydrate) e troquei a leitura manual do
`localStorage` por essa função em `reportService.ts`. Também melhorei a
mensagem de erro do botão PDF, que antes mostrava sempre o mesmo texto
genérico ("falta reportlab") não importa qual fosse o erro real — agora
mostra o `detail` que vem do backend.

## 9. Dinheiro das mesas não entrava no financeiro

Reportado pelo Tiago: só as entregas apareciam no financeiro, o dinheiro das
mesas não. Causa: `pay_tab` (backend) só mudava o status da **comanda**
para "paga" — nunca tocava no status dos **pedidos** dentro dela. Como o
financeiro (`revenue` em `BiDashboardPage.tsx`, e também `/reports/summary`
e `/reports/ledger`) só soma pedidos com status `entregue`, e nada além do
botão manual "Servir na mesa" (cozinha) movia um pedido de mesa pra
`entregue`, o dinheiro nunca contava — a menos que alguém lembrasse de
clicar nesse botão pra **cada item** de **cada comanda**, o que na prática
ninguém faz, porque o garçom já fechou e cobrou a conta.

Corrigido: pagar a comanda agora marca todos os pedidos dela como
`entregue` automaticamente (se ainda não estiverem) — pagamento é o sinal
real de venda concluída pro presencial, não devia depender de mais um
clique manual em outra tela. Testado o fluxo completo (abrir mesa → abrir
comanda → lançar item → fechar → pagar) confirmando que o pedido vira
`entregue` e passa a contar no financeiro.

## 3. O que ainda falta (não corrigido neste pacote)

- **Teste de ponta a ponta do fluxo presencial.** `backend/tests/` cobre
  delivery legado, export Excel e dashboard financeiro — falta um teste
  abrindo mesa → lançando comanda → fechando → pagando (o roteiro pede
  explicitamente "1 fluxo de delivery + 1 de mesa").
- **Tela de admin para criar garçom/cozinheiro.** `DriversManagementPage`
  só cria staff com papel `entrega` (hardcoded em `driverService`). Não há
  UI para cadastrar garçom ou cozinheiro — hoje só dá pra fazer via seed ou
  diretamente na API.
- **Recomendação é "mais vendidos" (popularidade geral)**, não "costuma ser
  pedido junto" (afinidade entre produtos). Isso é exatamente o Plano B que
  o roteiro já previa caso o tempo apertasse — está documentado no próprio
  código (`crud/recommendation.py`), mas vale deixar claro pro time e para
  o slide de "limitações honestas" do P3.
- **Git**: este pacote não é um repositório git — é preciso decidir com o
  time se vira um novo commit sobre `main` ou se o merge travado localmente
  é abortado (`git merge --abort`) e refeito a partir daqui.

## 4. Validação feita

- `python3 -m py_compile` em todo `backend/app` — sem erros de sintaxe.
- Import real de `app.main` com SQLite in-memory — todas as 42 rotas
  registram corretamente (antes eram 36; `/tables` e `/tabs` agora aparecem).
- Consulta corrigida do `crud/report.py` testada com dados reais em SQLite
  (custo, canal, nota e breakdown por staff) e compilada contra o dialeto
  PostgreSQL.
- `pytest` (backend) — 3 passam, 16 pulados por exigirem um Postgres real
  rodando (são testes de integração contra servidor ativo, não unitários).
- `npx vitest run` (frontend) — 30 testes, todos passando (revalidado após
  a correção do login do garçom).
- `npx tsc --noEmit` — zero erros (antes: `recharts` não resolvia).
- `npx vite build` — build de produção completo, sem erros.
