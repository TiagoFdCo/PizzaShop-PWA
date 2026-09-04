# ============================================================
# PizzaShop PWA
# Criacao de Branches vinculadas as Issues + Commit + Push
# ============================================================
#
# Continuacao do setup-github.ps1 (que cria as issues). Este script:
#   1. Busca o numero de cada issue pelo titulo (tem que ja existir --
#      rode setup-github.ps1 antes, se ainda nao rodou)
#   2. Cria uma branch vinculada a issue com `gh issue develop`
#      (aparece no "Development" da propria issue no GitHub)
#   3. Se houver arquivos mapeados pra essa issue E eles existirem em
#      disco, adiciona, commita (mensagem "Refs #<numero>") e da push
#   4. Se nao houver arquivo mapeado ainda, publica a branch vazia --
#      pronta pra pessoa responsavel comecar a trabalhar nela
#
# REQUISITOS
#
# 1. GitHub CLI instalado e autenticado (gh auth login)
# 2. Executar na raiz do repositorio (onde fica a pasta backend/)
# 3. Working tree limpo (sem mudancas nao commitadas)
#
# EXECUCAO
#
# Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#
# .\create-branches.ps1                  # cria as 48 branches
# .\create-branches.ps1 -Role P1         # so as issues do P1
# .\create-branches.ps1 -DryRun          # so mostra o que faria, nao executa nada
#
# ============================================================

param(
    [string]$Role = "",     # "P1".."P5" -- vazio processa todo mundo
    [switch]$DryRun
)

$ErrorActionPreference = "Continue"

# Este script controla o fluxo o tempo todo checando $LASTEXITCODE na mao
# apos cada chamada a git/gh -- entao nao usamos $ErrorActionPreference =
# "Stop": com "Stop", QUALQUER texto que um comando externo escreva no
# stderr (mesmo sem erro de verdade, ou um erro que a gente PROVOCA de
# proposito pra checar se uma branch existe) vira excecao e derruba o
# script. "Continue" deixa esses avisos aparecerem no console sem
# interromper nada, e a checagem de $LASTEXITCODE logo depois decide o que
# fazer.
$PSNativeCommandUseErrorActionPreference = $false

# ============================================================
# CABECALHO
# ============================================================

Clear-Host

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "              PizzaShop PWA" -ForegroundColor Cyan
Write-Host "         Criacao de Branches por Issue" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

if ($DryRun) {
    Write-Host "MODO DRY-RUN: nenhuma branch/commit/push sera criado de verdade." -ForegroundColor Magenta
    Write-Host ""
}

# ============================================================
# VERIFICAR GH E LOGIN
# ============================================================

Write-Host "[1/6] Verificando GitHub CLI..." -ForegroundColor Yellow

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host ""
    Write-Host "ERRO: GitHub CLI nao encontrado. Instale com: winget install --id GitHub.cli" -ForegroundColor Red
    exit 1
}

gh auth status
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERRO: GitHub CLI nao esta autenticado. Execute: gh auth login" -ForegroundColor Red
    exit 1
}

Write-Host "OK - GitHub CLI autenticado." -ForegroundColor Green

# ============================================================
# VERIFICAR GIT E WORKING TREE LIMPO
# ============================================================

Write-Host ""
Write-Host "[2/6] Verificando repositorio git..." -ForegroundColor Yellow

git rev-parse --is-inside-work-tree *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERRO: rode este script de dentro do repositorio clonado." -ForegroundColor Red
    exit 1
}

$status = git status --porcelain | Where-Object { $_ -notmatch '^\?\?' }
if ($status -and -not $DryRun) {
    Write-Host ""
    Write-Host "ERRO: voce tem mudancas em arquivos JA RASTREADOS pelo git, sem commit:" -ForegroundColor Red
    Write-Host ($status -join "`n") -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Commite ou de stash (git stash) nesses arquivos antes de rodar este script --" -ForegroundColor Yellow
    Write-Host "ele troca de branch varias vezes e pode misturar essas mudancas com as commitadas aqui." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "(Arquivos NOVOS ainda nao rastreados -- como os que voce acabou de extrair" -ForegroundColor Gray
    Write-Host "do backend-P1.zip -- nao entram nessa checagem, e tudo bem eles ficarem" -ForegroundColor Gray
    Write-Host "sem commit: e o proprio script que vai commitar cada um na branch certa.)" -ForegroundColor Gray
    exit 1
}

Write-Host "OK - working tree limpo." -ForegroundColor Green

# ============================================================
# IDENTIFICAR REPO E BRANCH PADRAO
# ============================================================

Write-Host ""
Write-Host "[3/6] Identificando repositorio..." -ForegroundColor Yellow

$repo = (gh repo view --json nameWithOwner --jq ".nameWithOwner").Trim()
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($repo)) {
    Write-Host ""
    Write-Host "ERRO: nao foi possivel identificar o repositorio." -ForegroundColor Red
    exit 1
}

$defaultBranch = (gh repo view --json defaultBranchRef --jq ".defaultBranchRef.name").Trim()

Write-Host "OK - Repositorio: $repo (branch padrao: $defaultBranch)" -ForegroundColor Green

if (-not $DryRun) {
    "n" | git checkout $defaultBranch | Out-Null
    git pull | Out-Null
}

# ============================================================
# BUSCAR TODAS AS ISSUES (titulo -> numero)
# ============================================================

Write-Host ""
Write-Host "[4/6] Buscando issues existentes..." -ForegroundColor Yellow

$issuesJson = gh issue list --repo $repo --state all --limit 200 --json number,title
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERRO: nao foi possivel listar as issues." -ForegroundColor Red
    exit 1
}

$issueMap = @{}
foreach ($issue in ($issuesJson | ConvertFrom-Json)) {
    $issueMap[$issue.title] = $issue.number
}

Write-Host "OK - $($issueMap.Count) issues encontradas." -ForegroundColor Green

# ============================================================
# FUNCAO: remover acentos e gerar slug pra nome de branch
# ============================================================

function Get-Slug {
    param([string]$Text)

    $accentMap = @{
        'á'='a';'à'='a';'ã'='a';'â'='a';'ä'='a'
        'é'='e';'ê'='e';'è'='e';'ë'='e'
        'í'='i';'ì'='i';'î'='i';'ï'='i'
        'ó'='o';'ô'='o';'õ'='o';'ò'='o';'ö'='o'
        'ú'='u';'ù'='u';'û'='u';'ü'='u'
        'ç'='c'
    }

    $result = $Text.ToLower()
    foreach ($key in $accentMap.Keys) {
        $result = $result.Replace($key, $accentMap[$key])
    }
    $result = $result -replace '[^a-z0-9]+', '-'
    $result = $result.Trim('-')

    if ($result.Length -gt 45) {
        $result = $result.Substring(0, 45).Trim('-')
    }

    return $result
}

# ============================================================
# FUNCAO: apaga do disco os arquivos ja commitados/pushados, e as pastas
# que ficarem vazias -- feito ANTES do checkout de volta pro main
# ============================================================
#
# Como nenhuma branch e mergeada no main durante este script, o main
# nunca tem esses arquivos -- entao toda troca de branch precisaria
# remove-los de qualquer forma. Deixar o proprio `git checkout` fazer essa
# remocao e o que trava o script no Windows: quando o OneDrive esta com um
# arquivo daquela pasta aberto no exato momento, o git pergunta
# interativamente "Deletion of directory 'X' failed. Should I try again?
# (y/n)" e fica esperando pra sempre. Apagando os arquivos AQUI, com
# Remove-Item (que sempre funcionou de forma confiavel nos testes), o git
# checkout nao encontra mais nada pra remover e o prompt nunca aparece.
#
# So apaga a PASTA se ela ficar vazia depois -- pastas compartilhadas com
# arquivos de outras issues (ex.: app/routers/ tem arquivo de varias
# issues diferentes) ficam intactas, com os arquivos das outras issues
# ainda la, esperando a vez delas.

function Remove-CommittedFiles {
    param([string[]]$Files)

    $touchedDirs = @{}

    foreach ($f in $Files) {
        if (Test-Path $f) {
            Remove-Item $f -Force -ErrorAction SilentlyContinue
        }
        $dir = Split-Path $f -Parent
        if ($dir) { $touchedDirs[$dir] = $true }
    }

    foreach ($dir in $touchedDirs.Keys) {
        if (Test-Path $dir) {
            $remaining = Get-ChildItem $dir -Force -ErrorAction SilentlyContinue
            if ($remaining.Count -eq 0) {
                Remove-Item $dir -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

# ============================================================
# FUNCAO: cria a branch da issue, commita arquivos (se houver) e da push
# ============================================================

function New-IssueBranch {
    param(
        [string]$Owner,
        [string]$Title,
        [string[]]$Files = @()
    )

    if ($Role -and $Owner -ne $Role) {
        return
    }

    if (-not $issueMap.ContainsKey($Title)) {
        Write-Host ""
        Write-Host "! Issue nao encontrada: $Title" -ForegroundColor Red
        Write-Host "  (rode setup-github.ps1 primeiro, ou confira se o titulo bate certinho)" -ForegroundColor Yellow
        return
    }

    $number = $issueMap[$Title]
    $slug = Get-Slug -Text $Title
    $branch = "$number-$slug"

    Write-Host ""
    Write-Host "[$Owner] issue #$number -- $Title" -ForegroundColor Cyan
    Write-Host "  branch: $branch" -ForegroundColor Gray

    if ($DryRun) {
        $fileNote = if ($Files.Count -gt 0) { "$($Files.Count) arquivo(s)" } else { "nenhum arquivo (branch vazia)" }
        Write-Host "  [dry-run] criaria/vincularia a branch e commitaria $fileNote" -ForegroundColor Magenta
        return
    }

    # ja existe local ou remotamente? so faz checkout, nao recria
    # (usa comandos que nunca "falham" de verdade -- so retornam string
    # vazia quando nao encontram nada -- pra nao depender de provocar um
    # erro do git e ter que engolir stderr)
    $localMatch = git branch --list $branch
    $localExists = [bool]$localMatch

    $remoteMatch = git ls-remote --heads origin $branch
    $remoteExists = [bool]$remoteMatch

    if ($localExists) {
        Write-Host "  = branch ja existe localmente, apenas fazendo checkout" -ForegroundColor DarkYellow
        "n" | git checkout $branch | Out-Null
    }
    elseif ($remoteExists) {
        Write-Host "  = branch ja existe no remoto, buscando e fazendo checkout" -ForegroundColor DarkYellow
        git fetch origin "${branch}:${branch}" | Out-Null
        "n" | git checkout $branch | Out-Null
    }
    else {
        gh issue develop $number --repo $repo --base $defaultBranch --name $branch --checkout
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ! falha ao criar a branch vinculada" -ForegroundColor Red
            return
        }
    }

    # --------------------------------------------------------
    # Commit dos arquivos mapeados (se existirem em disco)
    # --------------------------------------------------------

    if ($Files.Count -gt 0) {

        $existingFiles = @()
        foreach ($f in $Files) {
            if (Test-Path $f) {
                $existingFiles += $f
            }
            else {
                Write-Host "  ! arquivo nao encontrado, pulando: $f" -ForegroundColor Yellow
            }
        }

        if ($existingFiles.Count -gt 0) {

            git add $existingFiles

            $staged = git diff --cached --name-only
            if ($staged) {
                git commit -m "$Title" -m "Refs #$number" | Out-Null
                Write-Host "  + commit criado ($($existingFiles.Count) arquivo(s))" -ForegroundColor Green

                git push -u origin $branch
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "  + push OK" -ForegroundColor Green
                    Remove-CommittedFiles -Files $existingFiles
                }
                else {
                    Write-Host "  ! falha no push" -ForegroundColor Red
                }
            }
            else {
                Write-Host "  = nada novo para commitar (arquivos ja estavam no historico)" -ForegroundColor DarkYellow
            }
        }
        else {
            Write-Host "  ! nenhum arquivo mapeado foi encontrado localmente -- publicando branch vazia" -ForegroundColor Yellow
            git push -u origin $branch
        }
    }
    else {
        # sem arquivo mapeado ainda (issue de outra pessoa/fase) -- so publica a branch
        git push -u origin $branch
        Write-Host "  + branch publicada vazia, pronta para o responsavel comecar" -ForegroundColor Gray
    }

    # O "n" | antes do checkout e uma rede de seguranca (caso sobre algum
    # arquivo inesperado) -- responde "nao" automaticamente se o git
    # perguntar (interativo) "Deletion of directory 'X' failed. Should I
    # try again? (y/n)". A defesa de verdade e o Remove-CommittedFiles
    # acima, que ja apagou os arquivos do commit atual antes de chegar
    # aqui -- assim o proprio `git checkout` nao precisa apagar nada e o
    # prompt nem chega a aparecer na maioria das vezes.
    "n" | git checkout $defaultBranch | Out-Null
}
# ============================================================
#
# "Files" preenchido = arquivo ja existe em disco (commit de verdade).
# "Files" vazio = branch e criada e publicada vazia, pronta pra pessoa
# responsavel comecar a trabalhar (P2 a P5 ainda nao tem codigo escrito).

Write-Host ""
Write-Host "[5/6] Processando as issues..." -ForegroundColor Yellow

# ---------- MILESTONE 1 -- Backend and Base (P1) ----------

New-IssueBranch -Owner "TiagoFdCo" -Title "Criar estrutura base do backend FastAPI" -Files @(
    "backend/requirements.txt",
    "backend/Dockerfile",
    "backend/.gitignore",
    "backend/app/__init__.py",
    "backend/app/main.py",
    "backend/app/routers/orders.py",
    "backend/app/crud/order.py",
    "backend/tests/.gitkeep",
    "backend/README.md"
)

New-IssueBranch -Owner "TiagoFdCo" -Title "Configurar PostgreSQL com Docker Compose" -Files @(
    "backend/docker-compose.yml"
)

New-IssueBranch -Owner "TiagoFdCo" -Title "Criar configuracao de ambiente" -Files @(
    "backend/.env.example",
    "backend/app/core/__init__.py",
    "backend/app/core/config.py"
)

New-IssueBranch -Owner "TiagoFdCo" -Title "Criar models SQLAlchemy" -Files @(
    "backend/app/db/__init__.py",
    "backend/app/db/base.py",
    "backend/app/db/session.py",
    "backend/app/models/__init__.py",
    "backend/app/models/tenant.py",
    "backend/app/models/staff.py",
    "backend/app/models/product.py",
    "backend/app/models/order.py"
)

New-IssueBranch -Owner "TiagoFdCo" -Title "Criar migrations com Alembic" -Files @(
    "backend/alembic.ini",
    "backend/alembic/env.py",
    "backend/alembic/script.py.mako",
    "backend/alembic/versions/202608310001_schema_inicial.py"
)

New-IssueBranch -Owner "TiagoFdCo" -Title "Criar schemas Pydantic" -Files @(
    "backend/app/schemas/__init__.py",
    "backend/app/schemas/common.py",
    "backend/app/schemas/tenant.py",
    "backend/app/schemas/product.py",
    "backend/app/schemas/staff.py",
    "backend/app/schemas/order.py"
)

New-IssueBranch -Owner "TiagoFdCo" -Title "Implementar autenticacao JWT" -Files @(
    "backend/app/core/security.py",
    "backend/app/deps.py",
    "backend/app/routers/__init__.py",
    "backend/app/routers/auth.py"
)

New-IssueBranch -Owner "TiagoFdCo" -Title "Implementar autorizacao por roles" -Files @(
    "backend/app/crud/__init__.py",
    "backend/app/crud/staff.py",
    "backend/app/routers/staff.py"
)

New-IssueBranch -Owner "TiagoFdCo" -Title "Implementar CRUD de produtos" -Files @(
    "backend/app/crud/product.py",
    "backend/app/routers/products.py"
)

New-IssueBranch -Owner "TiagoFdCo" -Title "Implementar endpoints do tenant" -Files @(
    "backend/app/crud/tenant.py",
    "backend/app/routers/tenant.py"
)

New-IssueBranch -Owner "TiagoFdCo" -Title "Criar seed inicial do banco" -Files @(
    "backend/scripts/__init__.py",
    "backend/scripts/seed.py"
)

# "Criar health check da API": as 4 linhas do endpoint /health ja foram
# commitadas junto da issue 1 (fazem parte de app/main.py). Nao ha arquivo
# proprio pra recommitar aqui sem duplicar o commit anterior -- a branch e
# criada mesmo assim (fica vinculada e vazia), e o ideal e fechar essa issue
# referenciando o commit da issue 1 no comentario/PR.
New-IssueBranch -Owner "TiagoFdCo" -Title "Criar health check da API" -Files @()

# ---------- MILESTONE 2 -- Kitchen Flow (P2) ----------

#New-IssueBranch -Owner "P2" -Title "Implementar criacao de pedidos" -Files @()
#New-IssueBranch -Owner "P2" -Title "Implementar consulta de pedidos" -Files @()
#New-IssueBranch -Owner "P2" -Title "Implementar assumir pedido na cozinha" -Files @()
#New-IssueBranch -Owner "P2" -Title "Implementar marcar pedido como pronto" -Files @()
#New-IssueBranch -Owner "P2" -Title "Implementar despacho para entregador" -Files @()
#New-IssueBranch -Owner "P2" -Title "Criar tipos TypeScript para Staff" -Files @()
#New-IssueBranch -Owner "P2" -Title "Atualizar OrderStatus no frontend" -Files @()
#New-IssueBranch -Owner "P2" -Title "Criar KitchenLayout" -Files @()
#New-IssueBranch -Owner "P2" -Title "Criar KitchenOrdersPage" -Files @()
#New-IssueBranch -Owner "P2" -Title "Criar KitchenOrderCard" -Files @()
#New-IssueBranch -Owner "P2" -Title "Criar selecao de entregador na cozinha" -Files @()
#New-IssueBranch -Owner "P2" -Title "Criar feedback visual das acoes da cozinha" -Files @()

# ---------- MILESTONE 3 -- Delivery Flow (P3) ----------

#New-IssueBranch -Owner "P3" -Title "Implementar conclusao da entrega no backend" -Files @()
#New-IssueBranch -Owner "P3" -Title "Implementar falha de entrega no backend" -Files @()
#New-IssueBranch -Owner "P3" -Title "Criar DriverLayout" -Files @()
#New-IssueBranch -Owner "P3" -Title "Criar DriverOrdersPage" -Files @()
#New-IssueBranch -Owner "P3" -Title "Criar DriverOrderCard" -Files @()
#New-IssueBranch -Owner "P3" -Title "Criar DeliveryOutcomeModal" -Files @()
#New-IssueBranch -Owner "P3" -Title "Conectar conclusao da entrega ao backend" -Files @()
#New-IssueBranch -Owner "P3" -Title "Conectar falha da entrega ao backend" -Files @()
#New-IssueBranch -Owner "P3" -Title "Exibir historico de falhas de entrega" -Files @()
#New-IssueBranch -Owner "P3" -Title "Criar feedback visual do entregador" -Files @()
#New-IssueBranch -Owner "P3" -Title "Testar fluxo de entrega individualmente" -Files @()
#New-IssueBranch -Owner "P3" -Title "Validar transicoes de status dos pedidos" -Files @()

# ---------- MILESTONE 4 -- Integration and Deploy (P4 / P5) ----------

#New-IssueBranch -Owner "P5" -Title "Atualizar useAuthStore para JWT" -Files @()
#New-IssueBranch -Owner "P5" -Title "Refatorar authService para API real" -Files @()
#New-IssueBranch -Owner "P5" -Title "Atualizar ProtectedRoute para roles" -Files @()
#New-IssueBranch -Owner "P5" -Title "Adicionar rotas de cozinha e entrega" -Files @()
#New-IssueBranch -Owner "P5" -Title "Conectar api.ts ao backend real" -Files @()
#New-IssueBranch -Owner "P5" -Title "Refatorar orderService para endpoints reais" -Files @()
#New-IssueBranch -Owner "P5" -Title "Migrar frontend do json-server para FastAPI" -Files @()
#New-IssueBranch -Owner "P4" -Title "Atualizar OrdersTable e status visuais" -Files @()
#New-IssueBranch -Owner "P4" -Title "Atualizar OrderStatusTracker" -Files @()
#New-IssueBranch -Owner "P4" -Title "Revisar responsividade das telas novas" -Files @()
#New-IssueBranch -Owner "P5" -Title "Criar testes de integracao Frontend e Backend" -Files @()
#New-IssueBranch -Owner "P5" -Title "Preparar e executar deploy do sistema" -Files @()

# ============================================================
# [6/6] FINAL
# ============================================================

Write-Host ""
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "              PROCESSAMENTO FINALIZADO" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

if ($Role) {
    Write-Host "Filtro aplicado: apenas issues de $Role" -ForegroundColor Cyan
}

Write-Host "Voce esta de volta na branch: $defaultBranch" -ForegroundColor White
Write-Host ""
Write-Host "Se uma branch ja existir, ela e reaproveitada (nada e duplicado)." -ForegroundColor DarkYellow
Write-Host "Rode de novo com -DryRun pra conferir o plano antes de aplicar." -ForegroundColor DarkYellow
Write-Host ""