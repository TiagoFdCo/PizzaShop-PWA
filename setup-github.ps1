# ============================================================
# PizzaShop PWA
# GitHub Issues + Milestones + Labels
# ============================================================
#
# REQUISITOS
#
# 1. GitHub CLI instalado
#    https://cli.github.com/
#
# 2. Login:
#    gh auth login
#
# 3. Este script deve ser executado na raiz do repositorio.
#
# EXECUCAO:
#
# Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
# .\setup-github.ps1
#
# ============================================================

$ErrorActionPreference = "Stop"

# ============================================================
# CONFIGURACAO
# ============================================================

$P1 = "TiagoFdCo"
$P2 = "mateusgomes177"
$P3 = "diasdasilvajoaovitor673-ship-it"
$P4 = "DevArthur16"
$P5 = "AdinanDev41"

$M1 = "Milestone 1 - Backend and Base"
$M2 = "Milestone 2 - Kitchen Flow"
$M3 = "Milestone 3 - Delivery Flow"
$M4 = "Milestone 4 - Integration and Deploy"

# ============================================================
# CABECALHO
# ============================================================

Clear-Host

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "              PizzaShop PWA" -ForegroundColor Cyan
Write-Host "           GitHub Project Setup" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# VERIFICAR GH
# ============================================================

Write-Host "[1/5] Verificando GitHub CLI..." -ForegroundColor Yellow

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {

    Write-Host ""
    Write-Host "ERRO: GitHub CLI nao encontrado." -ForegroundColor Red
    Write-Host ""
    Write-Host "Instale com:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "winget install --id GitHub.cli" -ForegroundColor White
    Write-Host ""

    exit 1
}

Write-Host "OK - GitHub CLI encontrado." -ForegroundColor Green

# ============================================================
# VERIFICAR LOGIN
# ============================================================

Write-Host ""
Write-Host "[2/5] Verificando autenticacao..." -ForegroundColor Yellow

gh auth status

if ($LASTEXITCODE -ne 0) {

    Write-Host ""
    Write-Host "ERRO: GitHub CLI nao esta autenticado." -ForegroundColor Red
    Write-Host ""
    Write-Host "Execute:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "gh auth login" -ForegroundColor White
    Write-Host ""

    exit 1
}

Write-Host "OK - GitHub CLI autenticado." -ForegroundColor Green

# ============================================================
# DESCOBRIR REPOSITORIO
# ============================================================

Write-Host ""
Write-Host "[3/5] Identificando repositorio..." -ForegroundColor Yellow

$repo = gh repo view --json nameWithOwner --jq ".nameWithOwner"

if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($repo)) {

    Write-Host ""
    Write-Host "ERRO: nao foi possivel identificar o repositorio." -ForegroundColor Red
    Write-Host ""
    Write-Host "Execute o script dentro da pasta do repositorio." -ForegroundColor Yellow
    Write-Host ""

    exit 1
}

$repo = $repo.Trim()

Write-Host "OK - Repositorio: $repo" -ForegroundColor Green

# ============================================================
# FUNCAO PARA CRIAR LABEL
# ============================================================

function Ensure-Label {

    param(
        [string]$Name,
        [string]$Color,
        [string]$Description
    )

    try {

        gh label create $Name `
            --repo $repo `
            --color $Color `
            --description $Description `
            --force

        Write-Host "  + Label: $Name" -ForegroundColor Green

    }
    catch {

        Write-Host "  ! Falha na label: $Name" -ForegroundColor Yellow
    }
}

# ============================================================
# FUNCAO PARA CRIAR MILESTONE
# ============================================================

function Ensure-Milestone {

    param(
        [string]$Title
    )

    Write-Host "  Verificando milestone: $Title" -ForegroundColor Gray

    $endpoint = "repos/$repo/milestones?state=all&per_page=100"

    $response = gh api $endpoint

    if ($LASTEXITCODE -ne 0) {
        throw "Nao foi possivel consultar os milestones."
    }

    $milestones = $response | ConvertFrom-Json

    foreach ($milestone in $milestones) {

        if ($milestone.title -eq $Title) {

            Write-Host "  = Milestone ja existe: $Title" -ForegroundColor DarkYellow

            return $milestone.number
        }
    }

    $created = gh api `
        --method POST `
        "repos/$repo/milestones" `
        --field "title=$Title"

    if ($LASTEXITCODE -ne 0) {
        throw "Nao foi possivel criar o milestone: $Title"
    }

    $createdObject = $created | ConvertFrom-Json

    Write-Host "  + Milestone criado: $Title" -ForegroundColor Green

    return $createdObject.number
}

# ============================================================
# FUNCAO PARA CRIAR ISSUE
# ============================================================

function Ensure-Issue {

    param(
        [string]$Title,
        [string]$Body,
        [string[]]$Labels,
        [string]$Assignee,
        [string]$Milestone
    )

    # --------------------------------------------------------
    # Verificar se ja existe
    # --------------------------------------------------------

    $issues = gh issue list `
        --repo $repo `
        --state all `
        --limit 100 `
        --json number,title

    $existingIssue = $null

    if ($issues) {

        $issueObjects = $issues | ConvertFrom-Json

        foreach ($issue in $issueObjects) {

            if ($issue.title -eq $Title) {

                $existingIssue = $issue
                break
            }
        }
    }

    # --------------------------------------------------------
    # Se existir, nao criar novamente
    # --------------------------------------------------------

    if ($null -ne $existingIssue) {

        Write-Host ""
        Write-Host "  = ISSUE #$($existingIssue.number) ja existe" -ForegroundColor DarkYellow
        Write-Host "    $Title" -ForegroundColor DarkYellow

        return
    }

    # --------------------------------------------------------
    # Montar comando
    # --------------------------------------------------------

    $args = @(
        "issue",
        "create",
        "--repo",
        $repo,
        "--title",
        $Title,
        "--body",
        $Body,
        "--milestone",
        $Milestone,
        "--assignee",
        $Assignee
    )

    foreach ($label in $Labels) {

        $args += "--label"
        $args += $label
    }

    # --------------------------------------------------------
    # Criar issue
    # --------------------------------------------------------

    Write-Host ""
    Write-Host "  + Criando: $Title" -ForegroundColor Cyan
    Write-Host "    Responsavel: $Assignee" -ForegroundColor Gray
    Write-Host "    Milestone: $Milestone" -ForegroundColor Gray

    & gh @args

    if ($LASTEXITCODE -ne 0) {

        Write-Host ""
        Write-Host "  ! ERRO ao criar issue: $Title" -ForegroundColor Red
    }
}

# ============================================================
# LABELS
# ============================================================

Write-Host ""
Write-Host "[4/5] Criando labels..." -ForegroundColor Yellow

Ensure-Label `
    "backend" `
    "1D76DB" `
    "Tarefas relacionadas ao backend"

Ensure-Label `
    "frontend" `
    "5319E7" `
    "Tarefas relacionadas ao frontend"

Ensure-Label `
    "database" `
    "006B75" `
    "Banco de dados e persistencia"

Ensure-Label `
    "auth" `
    "B60205" `
    "Autenticacao e autorizacao"

Ensure-Label `
    "cozinha" `
    "D93F0B" `
    "Fluxo da cozinha"

Ensure-Label `
    "entrega" `
    "FBCA04" `
    "Fluxo de entrega"

Ensure-Label `
    "integration" `
    "0E8A16" `
    "Integracao frontend e backend"

Ensure-Label `
    "testing" `
    "7057FF" `
    "Testes"

Ensure-Label `
    "deploy" `
    "008672" `
    "Deploy e infraestrutura"

Ensure-Label `
    "design" `
    "C5DEF5" `
    "Interface e experiencia do usuario"

Ensure-Label `
    "priority: high" `
    "B60205" `
    "Alta prioridade"

Ensure-Label `
    "priority: medium" `
    "FBCA04" `
    "Media prioridade"

Ensure-Label `
    "priority: low" `
    "0E8A16" `
    "Baixa prioridade"

# ============================================================
# MILESTONES
# ============================================================

Write-Host ""
Write-Host "[5/5] Criando milestones..." -ForegroundColor Yellow

Ensure-Milestone $M1
Ensure-Milestone $M2
Ensure-Milestone $M3
Ensure-Milestone $M4

# ============================================================
# MILESTONE 1
# BACKEND AND BASE
# ============================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Magenta
Write-Host "MILESTONE 1 - BACKEND AND BASE" -ForegroundColor Magenta
Write-Host "============================================================" -ForegroundColor Magenta

# ------------------------------------------------------------
# ISSUE 01
# ------------------------------------------------------------

Ensure-Issue `
    "Criar estrutura base do backend FastAPI" `
@'
## Objetivo

Criar a estrutura inicial do backend utilizando FastAPI.

## Tarefas

- [ ] Criar `backend/`
- [ ] Criar `app/main.py`
- [ ] Criar `app/models/`
- [ ] Criar `app/schemas/`
- [ ] Criar `app/crud/`
- [ ] Criar `app/routers/`
- [ ] Criar `app/core/`
- [ ] Criar `app/deps.py`
- [ ] Configurar ambiente Python

## Criterio de aceite

A API deve iniciar corretamente e possuir um endpoint basico de teste.
'@ `
@("backend", "priority: high") `
$P1 `
$M1

# ------------------------------------------------------------
# ISSUE 02
# ------------------------------------------------------------

Ensure-Issue `
    "Configurar PostgreSQL com Docker Compose" `
@'
## Objetivo

Configurar PostgreSQL e a API utilizando Docker Compose.

## Tarefas

- [ ] Criar `docker-compose.yml`
- [ ] Criar servico PostgreSQL
- [ ] Criar servico API
- [ ] Configurar volumes
- [ ] Configurar variaveis de ambiente
- [ ] Testar conexao API -> PostgreSQL

## Criterio de aceite

`docker compose up` deve iniciar PostgreSQL e API corretamente.
'@ `
@("backend", "database", "priority: high") `
$P1 `
$M1

# ------------------------------------------------------------
# ISSUE 03
# ------------------------------------------------------------

Ensure-Issue `
    "Criar configuracao de ambiente" `
@'
## Objetivo

Centralizar as configuracoes da aplicacao.

## Tarefas

- [ ] Configurar `DATABASE_URL`
- [ ] Configurar `JWT_SECRET`
- [ ] Criar `.env.example`
- [ ] Evitar commit de secrets

## Criterio de aceite

A aplicacao deve carregar configuracoes por variaveis de ambiente.
'@ `
@("backend", "priority: high") `
$P1 `
$M1

# ------------------------------------------------------------
# ISSUE 04
# ------------------------------------------------------------

Ensure-Issue `
    "Criar models SQLAlchemy" `
@'
## Objetivo

Criar os models ORM utilizados pelo backend.

## Models

- [ ] Tenant
- [ ] Staff
- [ ] Product
- [ ] ProductTopping
- [ ] Order
- [ ] OrderItem
- [ ] OrderItemTopping
- [ ] DeliveryFailure

## Criterio de aceite

Os models e seus relacionamentos devem estar configurados corretamente.
'@ `
@("backend", "database", "priority: high") `
$P1 `
$M1

# ------------------------------------------------------------
# ISSUE 05
# ------------------------------------------------------------

Ensure-Issue `
    "Criar migrations com Alembic" `
@'
## Objetivo

Configurar migrations para o banco PostgreSQL.

## Tarefas

- [ ] Configurar Alembic
- [ ] Criar migration inicial
- [ ] Criar tabelas
- [ ] Criar enums
- [ ] Testar upgrade
- [ ] Testar downgrade

## Criterio de aceite

Um banco vazio deve poder ser configurado usando as migrations.
'@ `
@("backend", "database", "priority: high") `
$P1 `
$M1

# ------------------------------------------------------------
# ISSUE 06
# ------------------------------------------------------------

Ensure-Issue `
    "Criar schemas Pydantic" `
@'
## Objetivo

Criar schemas de request e response.

## Tarefas

- [ ] Tenant schemas
- [ ] Staff schemas
- [ ] Product schemas
- [ ] Order schemas
- [ ] Schemas de criacao
- [ ] Schemas de atualizacao
- [ ] Schemas de resposta

## Criterio de aceite

Os endpoints devem utilizar schemas Pydantic para validacao.
'@ `
@("backend", "priority: high") `
$P1 `
$M1

# ------------------------------------------------------------
# ISSUE 07
# ------------------------------------------------------------

Ensure-Issue `
    "Implementar autenticacao JWT" `
@'
## Objetivo

Implementar autenticacao real utilizando JWT.

## Endpoint

`POST /auth/login`

## Tarefas

- [ ] Validar usuario
- [ ] Validar senha
- [ ] Gerar JWT
- [ ] Inserir role no token
- [ ] Configurar expiracao
- [ ] Validar token

## Criterio de aceite

Um usuario valido deve conseguir realizar login e receber um JWT.
'@ `
@("backend", "auth", "priority: high") `
$P1 `
$M1

# ------------------------------------------------------------
# ISSUE 08
# ------------------------------------------------------------

Ensure-Issue `
    "Implementar autorizacao por roles" `
@'
## Objetivo

Implementar autorizacao baseada no papel do funcionario.

## Roles

- `admin`
- `cozinha`
- `entrega`

## Tarefas

- [ ] Criar `get_current_staff`
- [ ] Criar verificacao de roles
- [ ] Criar `require_role`
- [ ] Proteger endpoints
- [ ] Retornar HTTP 403 quando necessario

## Criterio de aceite

Usuarios nao podem executar operacoes que nao pertencem ao seu role.
'@ `
@("backend", "auth", "priority: high") `
$P1 `
$M1

# ------------------------------------------------------------
# ISSUE 09
# ------------------------------------------------------------

Ensure-Issue `
    "Implementar CRUD de produtos" `
@'
## Objetivo

Implementar gerenciamento de produtos.

## Endpoints

- [ ] GET `/products`
- [ ] POST `/products`
- [ ] PUT `/products/{id}`
- [ ] DELETE `/products/{id}`

## Criterio de aceite

Produtos devem poder ser criados, consultados, atualizados e removidos.
'@ `
@("backend", "database", "priority: medium") `
$P1 `
$M1

# ------------------------------------------------------------
# ISSUE 10
# ------------------------------------------------------------

Ensure-Issue `
    "Implementar endpoints do tenant" `
@'
## Objetivo

Implementar gerenciamento das informacoes do estabelecimento.

## Endpoints

- [ ] GET `/tenant`
- [ ] PUT `/tenant`

## Criterio de aceite

As informacoes devem ser persistidas no PostgreSQL.
'@ `
@("backend", "database", "priority: medium") `
$P1 `
$M1

# ------------------------------------------------------------
# ISSUE 11
# ------------------------------------------------------------

Ensure-Issue `
    "Criar seed inicial do banco" `
@'
## Objetivo

Criar dados iniciais para facilitar o desenvolvimento.

## Tarefas

- [ ] Criar seed
- [ ] Criar usuario admin
- [ ] Criar usuarios cozinha
- [ ] Criar usuarios entrega
- [ ] Criar produtos
- [ ] Criar tenant
- [ ] Opcionalmente importar dados existentes do `db.json`

## Criterio de aceite

Um banco novo deve poder ser populado automaticamente.
'@ `
@("backend", "database", "priority: medium") `
$P1 `
$M1

# ------------------------------------------------------------
# ISSUE 12
# ------------------------------------------------------------

Ensure-Issue `
    "Criar health check da API" `
@'
## Objetivo

Criar endpoint para verificar se a API esta funcionando.

## Endpoint

`GET /health`

## Criterio de aceite

O endpoint deve retornar HTTP 200 quando a API estiver funcionando.
'@ `
@("backend", "priority: low") `
$P1 `
$M1

# ============================================================
# MILESTONE 2
# KITCHEN FLOW
# ============================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Magenta
Write-Host "MILESTONE 2 - KITCHEN FLOW" -ForegroundColor Magenta
Write-Host "============================================================" -ForegroundColor Magenta

# ------------------------------------------------------------
# ISSUE 13
# ------------------------------------------------------------

Ensure-Issue `
    "Implementar criacao de pedidos" `
@'
## Objetivo

Implementar endpoint para criacao de pedidos.

## Endpoint

`POST /orders`

## Tarefas

- [ ] Validar itens
- [ ] Calcular total
- [ ] Persistir pedido
- [ ] Persistir itens
- [ ] Definir status inicial como `recebido`

## Criterio de aceite

Um pedido deve ser criado corretamente no banco.
'@ `
@("backend", "priority: high") `
$P2 `
$M2

# ------------------------------------------------------------
# ISSUE 14
# ------------------------------------------------------------

Ensure-Issue `
    "Implementar consulta de pedidos" `
@'
## Objetivo

Implementar consulta de pedidos.

## Endpoints

- [ ] GET `/orders`
- [ ] GET `/orders/{id}`

## Regras

- Admin pode consultar todos.
- Cozinha pode consultar os pedidos necessarios.
- Entregador deve receber somente pedidos atribuidos a ele.

## Criterio de aceite

Os resultados devem respeitar o role do usuario.
'@ `
@("backend", "priority: high") `
$P2 `
$M2

# ------------------------------------------------------------
# ISSUE 15
# ------------------------------------------------------------

Ensure-Issue `
    "Implementar assumir pedido na cozinha" `
@'
## Objetivo

Permitir que um cozinheiro assuma um pedido.

## Endpoint

`PATCH /orders/{id}/claim`

## Tarefas

- [ ] Verificar role `cozinha`
- [ ] Definir `cook_id`
- [ ] Alterar status para `preparo`

## Criterio de aceite

O pedido deve registrar qual cozinheiro assumiu o preparo.
'@ `
@("backend", "cozinha", "priority: high") `
$P2 `
$M2

# ------------------------------------------------------------
# ISSUE 16
# ------------------------------------------------------------

Ensure-Issue `
    "Implementar marcar pedido como pronto" `
@'
## Objetivo

Permitir que a cozinha marque o pedido como pronto.

## Endpoint

`PATCH /orders/{id}/ready`

## Fluxo

`preparo` -> `pronto_entrega`

## Criterio de aceite

Somente usuarios da cozinha devem executar essa operacao.
'@ `
@("backend", "cozinha", "priority: high") `
$P2 `
$M2

# ------------------------------------------------------------
# ISSUE 17
# ------------------------------------------------------------

Ensure-Issue `
    "Implementar despacho para entregador" `
@'
## Objetivo

Permitir selecionar o entregador para um pedido pronto.

## Endpoint

`PATCH /orders/{id}/dispatch`

## Tarefas

- [ ] Receber `driver_id`
- [ ] Validar entregador
- [ ] Definir entregador
- [ ] Alterar status para `saiu_para_entrega`

## Criterio de aceite

O pedido deve ficar atribuido ao entregador selecionado.
'@ `
@("backend", "cozinha", "entrega", "priority: high") `
$P2 `
$M2

# ------------------------------------------------------------
# ISSUE 18
# ------------------------------------------------------------

Ensure-Issue `
    "Criar tipos TypeScript para Staff" `
@'
## Objetivo

Criar os tipos utilizados para funcionarios.

## Tarefas

- [ ] Criar `StaffRole`
- [ ] Criar `Staff`
- [ ] Criar `StaffReference`
- [ ] Criar tipos de `Cook`
- [ ] Criar tipos de `Driver`

## Criterio de aceite

O frontend deve possuir tipagem para os diferentes funcionarios.
'@ `
@("frontend", "cozinha", "entrega", "priority: high") `
$P2 `
$M2

# ------------------------------------------------------------
# ISSUE 19
# ------------------------------------------------------------

Ensure-Issue `
    "Atualizar OrderStatus no frontend" `
@'
## Objetivo

Adicionar todos os estados dos pedidos.

## Status

- [ ] `recebido`
- [ ] `preparo`
- [ ] `pronto_entrega`
- [ ] `saiu_para_entrega`
- [ ] `entregue`
- [ ] `falha_entrega`

## Criterio de aceite

Todos os componentes devem reconhecer os novos estados.
'@ `
@("frontend", "cozinha", "entrega", "priority: high") `
$P2 `
$M2

# ------------------------------------------------------------
# ISSUE 20
# ------------------------------------------------------------

Ensure-Issue `
    "Criar KitchenLayout" `
@'
## Objetivo

Criar layout especifico para a cozinha.

## Tarefas

- [ ] Criar `KitchenLayout.tsx`
- [ ] Criar navegacao
- [ ] Exibir usuario logado
- [ ] Criar area de conteudo
- [ ] Garantir responsividade

## Arquivo principal

`components/layout/KitchenLayout.tsx`
'@ `
@("frontend", "cozinha", "priority: high") `
$P2 `
$M2

# ------------------------------------------------------------
# ISSUE 21
# ------------------------------------------------------------

Ensure-Issue `
    "Criar KitchenOrdersPage" `
@'
## Objetivo

Criar pagina com a fila de pedidos da cozinha.

## Fluxo

`recebido` -> `preparo` -> `pronto_entrega`

## Tarefas

- [ ] Buscar pedidos
- [ ] Separar por status
- [ ] Exibir pedidos recebidos
- [ ] Exibir pedidos em preparo
- [ ] Exibir pedidos prontos

## Arquivo

`pages/kitchen/KitchenOrdersPage.tsx`
'@ `
@("frontend", "cozinha", "priority: high") `
$P2 `
$M2

# ------------------------------------------------------------
# ISSUE 22
# ------------------------------------------------------------

Ensure-Issue `
    "Criar KitchenOrderCard" `
@'
## Objetivo

Criar componente visual para um pedido da cozinha.

## Exibir

- [ ] Numero do pedido
- [ ] Itens
- [ ] Quantidades
- [ ] Observacoes
- [ ] Status
- [ ] Cozinheiro

## Acoes

- [ ] Iniciar preparo
- [ ] Marcar pronto
- [ ] Enviar para entregador

## Arquivo

`components/kitchen/KitchenOrderCard.tsx`
'@ `
@("frontend", "cozinha", "priority: high") `
$P2 `
$M2

# ------------------------------------------------------------
# ISSUE 23
# ------------------------------------------------------------

Ensure-Issue `
    "Criar selecao de entregador na cozinha" `
@'
## Objetivo

Permitir que a cozinha selecione o entregador.

## Tarefas

- [ ] Buscar entregadores
- [ ] Criar seletor
- [ ] Selecionar entregador
- [ ] Enviar `driver_id`
- [ ] Atualizar pedido

## Criterio de aceite

O pedido deve aparecer posteriormente no painel do entregador selecionado.
'@ `
@("frontend", "cozinha", "entrega", "priority: high") `
$P2 `
$M2

# ------------------------------------------------------------
# ISSUE 24
# ------------------------------------------------------------

Ensure-Issue `
    "Criar feedback visual das acoes da cozinha" `
@'
## Objetivo

Informar ao cozinheiro quando uma operacao foi realizada.

## Tarefas

- [ ] Loading
- [ ] Sucesso
- [ ] Erro
- [ ] Desabilitar botoes durante requisicao

## Criterio de aceite

Todas as acoes devem possuir feedback visual.
'@ `
@("frontend", "cozinha", "design", "priority: medium") `
$P2 `
$M2

# ============================================================
# MILESTONE 3
# DELIVERY FLOW
# ============================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Magenta
Write-Host "MILESTONE 3 - DELIVERY FLOW" -ForegroundColor Magenta
Write-Host "============================================================" -ForegroundColor Magenta

# ------------------------------------------------------------
# ISSUE 25
# ------------------------------------------------------------

Ensure-Issue `
    "Implementar conclusao da entrega no backend" `
@'
## Objetivo

Permitir que o entregador confirme a entrega.

## Endpoint

`PATCH /orders/{id}/delivered`

## Regras

- [ ] Apenas role `entrega`
- [ ] Pedido deve estar em `saiu_para_entrega`
- [ ] Pedido deve pertencer ao entregador

## Criterio de aceite

O pedido deve assumir status `entregue`.
'@ `
@("backend", "entrega", "priority: high") `
$P3 `
$M3

# ------------------------------------------------------------
# ISSUE 26
# ------------------------------------------------------------

Ensure-Issue `
    "Implementar falha de entrega no backend" `
@'
## Objetivo

Registrar uma entrega que nao pode ser realizada.

## Endpoint

`PATCH /orders/{id}/failed`

## Motivos

- [ ] Cliente ausente
- [ ] Endereco nao encontrado
- [ ] Cliente recusou
- [ ] Problema com veiculo
- [ ] Outro

## Dados

- Motivo obrigatorio
- Descricao opcional

## Criterio de aceite

A falha deve ser persistida e o pedido deve assumir `falha_entrega`.
'@ `
@("backend", "entrega", "priority: high") `
$P3 `
$M3

# ------------------------------------------------------------
# ISSUE 27
# ------------------------------------------------------------

Ensure-Issue `
    "Criar DriverLayout" `
@'
## Objetivo

Criar layout especifico para entregadores.

## Tarefas

- [ ] Criar `DriverLayout.tsx`
- [ ] Criar navegacao
- [ ] Exibir usuario
- [ ] Criar area de conteudo
- [ ] Responsividade

## Arquivo

`components/layout/DriverLayout.tsx`
'@ `
@("frontend", "entrega", "priority: high") `
$P3 `
$M3

# ------------------------------------------------------------
# ISSUE 28
# ------------------------------------------------------------

Ensure-Issue `
    "Criar DriverOrdersPage" `
@'
## Objetivo

Criar pagina com pedidos atribuidos ao entregador.

## Tarefas

- [ ] Buscar pedidos
- [ ] Filtrar por usuario
- [ ] Exibir pedidos em `saiu_para_entrega`
- [ ] Atualizar apos acao

## Criterio de aceite

O entregador deve visualizar somente os pedidos atribuidos a ele.
'@ `
@("frontend", "entrega", "priority: high") `
$P3 `
$M3

# ------------------------------------------------------------
# ISSUE 29
# ------------------------------------------------------------

Ensure-Issue `
    "Criar DriverOrderCard" `
@'
## Objetivo

Criar componente visual para cada pedido de entrega.

## Exibir

- [ ] Cliente
- [ ] Endereco
- [ ] Telefone
- [ ] Itens
- [ ] Valor
- [ ] Status

## Acoes

- [ ] Entregue
- [ ] Nao consegui entregar

## Arquivo

`components/driver/DriverOrderCard.tsx`
'@ `
@("frontend", "entrega", "priority: high") `
$P3 `
$M3

# ------------------------------------------------------------
# ISSUE 30
# ------------------------------------------------------------

Ensure-Issue `
    "Criar DeliveryOutcomeModal" `
@'
## Objetivo

Criar modal para registrar o resultado da entrega.

## Opcoes

- [ ] Entregue
- [ ] Nao consegui entregar

## Em caso de falha

- [ ] Selecionar motivo
- [ ] Informar descricao opcional
- [ ] Confirmar

## Arquivo

`components/driver/DeliveryOutcomeModal.tsx`
'@ `
@("frontend", "entrega", "priority: high") `
$P3 `
$M3

# ------------------------------------------------------------
# ISSUE 31
# ------------------------------------------------------------

Ensure-Issue `
    "Conectar conclusao da entrega ao backend" `
@'
## Objetivo

Conectar a acao "Entregue" ao endpoint real.

## Endpoint

`PATCH /orders/{id}/delivered`

## Criterio de aceite

Apos confirmar, o pedido deve assumir status `entregue`.
'@ `
@("frontend", "entrega", "integration", "priority: high") `
$P3 `
$M3

# ------------------------------------------------------------
# ISSUE 32
# ------------------------------------------------------------

Ensure-Issue `
    "Conectar falha da entrega ao backend" `
@'
## Objetivo

Conectar o fluxo de falha ao endpoint real.

## Endpoint

`PATCH /orders/{id}/failed`

## Tarefas

- [ ] Enviar motivo
- [ ] Enviar descricao
- [ ] Atualizar pedido
- [ ] Exibir feedback

## Criterio de aceite

O pedido deve assumir `falha_entrega`.
'@ `
@("frontend", "entrega", "integration", "priority: high") `
$P3 `
$M3

# ------------------------------------------------------------
# ISSUE 33
# ------------------------------------------------------------

Ensure-Issue `
    "Exibir historico de falhas de entrega" `
@'
## Objetivo

Permitir visualizar informacoes de falhas registradas.

## Exibir

- [ ] Motivo
- [ ] Descricao
- [ ] Data
- [ ] Entregador
- [ ] Pedido

## Criterio de aceite

As informacoes devem vir da API.
'@ `
@("frontend", "entrega", "priority: medium") `
$P3 `
$M3

# ------------------------------------------------------------
# ISSUE 34
# ------------------------------------------------------------

Ensure-Issue `
    "Criar feedback visual do entregador" `
@'
## Objetivo

Informar ao entregador o resultado das operacoes.

## Tarefas

- [ ] Loading
- [ ] Sucesso
- [ ] Erro
- [ ] Mensagem de feedback
- [ ] Atualizacao da lista

## Criterio de aceite

Toda operacao deve possuir feedback visual.
'@ `
@("frontend", "entrega", "design", "priority: medium") `
$P3 `
$M3

# ------------------------------------------------------------
# ISSUE 35
# ------------------------------------------------------------

Ensure-Issue `
    "Testar fluxo de entrega individualmente" `
@'
## Objetivo

Validar todas as operacoes do entregador.

## Testes

- [ ] Pedido atribuido aparece
- [ ] Pedido nao atribuido nao aparece
- [ ] Entrega concluida
- [ ] Entrega falha
- [ ] Motivo obrigatorio
- [ ] Status atualizado

## Criterio de aceite

Todas as operacoes devem funcionar sem inconsistencias.
'@ `
@("testing", "entrega", "priority: high") `
$P3 `
$M3

# ------------------------------------------------------------
# ISSUE 36
# ------------------------------------------------------------

Ensure-Issue `
    "Validar transicoes de status dos pedidos" `
@'
## Objetivo

Garantir que pedidos nao possam pular etapas indevidamente.

## Fluxo normal

`recebido`
-> `preparo`
-> `pronto_entrega`
-> `saiu_para_entrega`
-> `entregue`

## Fluxo alternativo

`saiu_para_entrega`
-> `falha_entrega`

## Criterio de aceite

A API deve rejeitar transicoes invalidas.
'@ `
@("backend", "testing", "entrega", "priority: high") `
$P3 `
$M3

# ============================================================
# MILESTONE 4
# INTEGRATION AND DEPLOY
# ============================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Magenta
Write-Host "MILESTONE 4 - INTEGRATION AND DEPLOY" -ForegroundColor Magenta
Write-Host "============================================================" -ForegroundColor Magenta

# ------------------------------------------------------------
# ISSUE 37
# ------------------------------------------------------------

Ensure-Issue `
    "Atualizar useAuthStore para JWT" `
@'
## Objetivo

Atualizar o estado global de autenticacao.

## Tarefas

- [ ] Armazenar JWT
- [ ] Armazenar usuario
- [ ] Armazenar role
- [ ] Restaurar sessao
- [ ] Logout

## Criterio de aceite

O estado de autenticacao deve controlar corretamente a sessao do usuario.
'@ `
@("frontend", "auth", "priority: high") `
$P5 `
$M4

# ------------------------------------------------------------
# ISSUE 38
# ------------------------------------------------------------

Ensure-Issue `
    "Refatorar authService para API real" `
@'
## Objetivo

Substituir o login mockado pelo endpoint real.

## Endpoint

`POST /auth/login`

## Tarefas

- [ ] Enviar username
- [ ] Enviar password
- [ ] Receber JWT
- [ ] Receber role
- [ ] Tratar erro

## Criterio de aceite

O frontend deve autenticar contra a API FastAPI.
'@ `
@("frontend", "auth", "integration", "priority: high") `
$P5 `
$M4

# ------------------------------------------------------------
# ISSUE 39
# ------------------------------------------------------------

Ensure-Issue `
    "Atualizar ProtectedRoute para roles" `
@'
## Objetivo

Permitir proteger rotas por papel.

## Tarefas

- [ ] Adicionar `allowedRoles`
- [ ] Verificar role
- [ ] Redirecionar usuario sem permissao
- [ ] Testar acesso

## Rotas esperadas

- `/cozinha` -> `cozinha`
- `/entrega` -> `entrega`
- `/admin` -> `admin`
'@ `
@("frontend", "auth", "priority: high") `
$P5 `
$M4

# ------------------------------------------------------------
# ISSUE 40
# ------------------------------------------------------------

Ensure-Issue `
    "Adicionar rotas de cozinha e entrega" `
@'
## Objetivo

Adicionar as novas paginas ao sistema de rotas.

## Rotas

- [ ] `/cozinha`
- [ ] `/entrega`

## Regras

- Cozinha -> role `cozinha`
- Entrega -> role `entrega`
- Admin -> acesso administrativo

## Criterio de aceite

Usuarios devem ser redirecionados corretamente de acordo com seu role.
'@ `
@("frontend", "auth", "cozinha", "entrega", "priority: high") `
$P5 `
$M4

# ------------------------------------------------------------
# ISSUE 41
# ------------------------------------------------------------

Ensure-Issue `
    "Conectar api.ts ao backend real" `
@'
## Objetivo

Configurar a camada HTTP do frontend para consumir a API FastAPI.

## Tarefas

- [ ] Configurar `BASE_URL`
- [ ] Adicionar `Authorization`
- [ ] Enviar JWT
- [ ] Tratar erros HTTP
- [ ] Tratar HTTP 401
- [ ] Tratar HTTP 403

## Criterio de aceite

O frontend deve conseguir consumir a API autenticada.
'@ `
@("frontend", "integration", "auth", "priority: high") `
$P5 `
$M4

# ------------------------------------------------------------
# ISSUE 42
# ------------------------------------------------------------

Ensure-Issue `
    "Refatorar orderService para endpoints reais" `
@'
## Objetivo

Substituir chamadas mockadas pelos endpoints reais.

## Funcoes

- [ ] `createOrder()`
- [ ] `getOrders()`
- [ ] `claimOrderForCooking()`
- [ ] `markOrderReady()`
- [ ] `dispatchOrder()`
- [ ] `markOrderDelivered()`
- [ ] `markOrderFailed()`

## Criterio de aceite

Todas as operacoes devem consumir a API real.
'@ `
@("frontend", "integration", "priority: high") `
$P5 `
$M4

# ------------------------------------------------------------
# ISSUE 43
# ------------------------------------------------------------

Ensure-Issue `
    "Migrar frontend do json-server para FastAPI" `
@'
## Objetivo

Remover a dependencia do json-server.

## Tarefas

- [ ] Remover chamadas ao `db.json`
- [ ] Remover `mock-api`
- [ ] Atualizar services
- [ ] Atualizar README
- [ ] Testar API real

## Criterio de aceite

O frontend deve funcionar exclusivamente com a API FastAPI.
'@ `
@("frontend", "backend", "integration", "priority: high") `
$P5 `
$M4

# ------------------------------------------------------------
# ISSUE 44
# ------------------------------------------------------------

Ensure-Issue `
    "Atualizar OrdersTable e status visuais" `
@'
## Objetivo

Atualizar a tabela administrativa de pedidos.

## Tarefas

- [ ] Adicionar coluna Cozinheiro
- [ ] Adicionar coluna Entregador
- [ ] Adicionar `pronto_entrega`
- [ ] Adicionar `saiu_para_entrega`
- [ ] Adicionar `falha_entrega`
- [ ] Atualizar badges
- [ ] Atualizar filtros

## Criterio de aceite

A tabela deve representar corretamente todos os estados.
'@ `
@("frontend", "design", "priority: medium") `
$P4 `
$M4

# ------------------------------------------------------------
# ISSUE 45
# ------------------------------------------------------------

Ensure-Issue `
    "Atualizar OrderStatusTracker" `
@'
## Objetivo

Atualizar o componente de acompanhamento do pedido.

## Tarefas

- [ ] Adicionar `pronto_entrega`
- [ ] Adicionar `saiu_para_entrega`
- [ ] Adicionar `entregue`
- [ ] Adicionar `falha_entrega`
- [ ] Tratar `falha_entrega` como estado terminal alternativo

## Criterio de aceite

O tracker deve representar corretamente o fluxo normal e o fluxo de falha.
'@ `
@("frontend", "design", "entrega", "priority: medium") `
$P4 `
$M4

# ------------------------------------------------------------
# ISSUE 46
# ------------------------------------------------------------

Ensure-Issue `
    "Revisar responsividade das telas novas" `
@'
## Objetivo

Garantir responsividade das novas telas.

## Telas

- [ ] KitchenOrdersPage
- [ ] KitchenOrderCard
- [ ] DriverOrdersPage
- [ ] DriverOrderCard
- [ ] DeliveryOutcomeModal
- [ ] KitchenLayout
- [ ] DriverLayout

## Testar

- [ ] Desktop
- [ ] Tablet
- [ ] Mobile
'@ `
@("frontend", "design", "priority: medium") `
$P4 `
$M4

# ------------------------------------------------------------
# ISSUE 47
# ------------------------------------------------------------

Ensure-Issue `
    "Criar testes de integracao Frontend e Backend" `
@'
## Objetivo

Validar o fluxo completo entre frontend e backend.

## Fluxo

Login
-> Cozinha
-> Pedido
-> Entregador
-> Entrega ou Falha

## Tarefas

- [ ] Testar login
- [ ] Testar criacao de pedido
- [ ] Testar cozinha
- [ ] Testar despacho
- [ ] Testar entrega
- [ ] Testar falha
- [ ] Testar autorizacao

## Criterio de aceite

O fluxo completo deve funcionar sem erros.
'@ `
@("testing", "integration", "priority: high") `
$P5 `
$M4

# ------------------------------------------------------------
# ISSUE 48
# ------------------------------------------------------------

Ensure-Issue `
    "Preparar e executar deploy do sistema" `
@'
## Objetivo

Preparar o PizzaShop PWA para producao.

## Backend

- [ ] Criar Dockerfile
- [ ] Configurar variaveis de ambiente
- [ ] Configurar CORS
- [ ] Configurar PostgreSQL
- [ ] Configurar secrets
- [ ] Executar migrations
- [ ] Executar seed
- [ ] Testar health check

## Frontend

- [ ] Configurar URL da API
- [ ] Configurar build
- [ ] Configurar SPA routing
- [ ] Publicar frontend

## Validacao

- [ ] Login
- [ ] Cozinha
- [ ] Entrega
- [ ] Falha de entrega
- [ ] Fluxo completo

## Criterio de aceite

O sistema deve estar funcionando em ambiente de producao.
'@ `
@("backend", "frontend", "deploy", "testing", "priority: high") `
$P5 `
$M4

# ============================================================
# FINAL
# ============================================================

Write-Host ""
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "              SETUP FINALIZADO" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

Write-Host "Repositorio:" -ForegroundColor Cyan
Write-Host "  $repo" -ForegroundColor White

Write-Host ""
Write-Host "Equipe:" -ForegroundColor Cyan
Write-Host "  P1 -> $P1" -ForegroundColor White
Write-Host "  P2 -> $P2" -ForegroundColor White
Write-Host "  P3 -> $P3" -ForegroundColor White
Write-Host "  P4 -> $P4" -ForegroundColor White
Write-Host "  P5 -> $P5" -ForegroundColor White

Write-Host ""
Write-Host "Milestones:" -ForegroundColor Cyan
Write-Host "  1 -> $M1" -ForegroundColor White
Write-Host "  2 -> $M2" -ForegroundColor White
Write-Host "  3 -> $M3" -ForegroundColor White
Write-Host "  4 -> $M4" -ForegroundColor White

Write-Host ""
Write-Host "Issues planejadas: 48" -ForegroundColor Green
Write-Host ""

Write-Host "Se uma Issue ja existir, ela sera ignorada." -ForegroundColor DarkYellow
Write-Host "Assim voce pode executar o script novamente sem duplicar Issues." -ForegroundColor DarkYellow

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""