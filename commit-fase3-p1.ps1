# ============================================================
# PizzaShop PWA - Fase 3 (P1)
# Commit + push dos arquivos nas branches do P1, PR para a
# branch de integracao e merge da PR.
# ============================================================
#
# O QUE ESTE SCRIPT FAZ
#
#   Para CADA branch do P1 (so as suas: 69 e 70), na ordem:
#     1. Faz checkout da branch (busca do origin se preciso)
#     2. Copia os arquivos daquela etapa de -SourceDir pro repo
#     3. git add + commit (pula se nada mudou -> idempotente)
#     4. git push
#     5. Abre PR  ->  feat/integracao-sistema  (se ainda nao existe)
#     6. Faz merge da PR (a menos que -NoMerge)
#
#   A ordem importa: a #69 (models + migration) entra ANTES da
#   #70 (crud/rotas), porque a #70 depende dos models da #69.
#
# POR QUE "Refs #69" E NAO "Closes #69"
#
#   O GitHub so fecha issue automaticamente quando o merge vai pra
#   branch PADRAO do repo. Como estas PRs vao pra feat/integracao-
#   sistema, as issues NAO fecham sozinhas -- por isso o corpo usa
#   "Refs". Elas fecham quando a integracao subir pra main (ou voce
#   fecha na mao).
#
# REQUISITOS
#
#   1. GitHub CLI instalado e autenticado:  gh auth login
#   2. Rodar na RAIZ do repositorio (onde fica a pasta backend/)
#   3. Arvore de trabalho LIMPA (sem alteracoes pendentes) -- o
#      script troca de branch, entao commite/guarde o que tiver antes
#   4. Os arquivos novos ficam em -SourceDir, espelhando a estrutura
#      do repo. Ex.: se -SourceDir vale "_fase3_p1", entao deve haver
#         _fase3_p1\backend\app\models\table.py
#         _fase3_p1\backend\alembic\versions\202609070001_fase3_fundacao.py
#         ... etc.
#      (Baixe a pasta "backend" que te entreguei para dentro de _fase3_p1\)
#
# EXECUCAO
#
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#
#   .\commit-fase3-p1.ps1 -DryRun                 # ensaia, nao muda nada
#   .\commit-fase3-p1.ps1                          # commita+push+PR+merge
#   .\commit-fase3-p1.ps1 -NoMerge                 # vai ate a PR, NAO faz merge
#   .\commit-fase3-p1.ps1 -MergeMethod merge       # merge commit (padrao: squash)
#   .\commit-fase3-p1.ps1 -SourceDir C:\tmp\p1     # de onde copiar os arquivos
#
# ============================================================

param(
    [string]$SourceDir = "_fase3_p1",
    [string]$BaseBranch = "feat/integracao-sistema",
    [string]$CreateBaseFrom = "main",   # se a base nao existir, cria a partir daqui ("" = nao cria)
    [ValidateSet("squash", "merge", "rebase")]
    [string]$MergeMethod = "squash",
    [switch]$DeleteBranch,              # apaga a branch da feature apos o merge
    [switch]$NoMerge,                   # para antes de aceitar a PR
    [switch]$DryRun
)

# Mesma logica dos outros scripts: controlamos o fluxo checando
# $LASTEXITCODE na mao. Com "Stop", um aviso benigno no stderr de um
# gh/git derrubaria o script.
$ErrorActionPreference = "Continue"
$PSNativeCommandUseErrorActionPreference = $false

# ============================================================
# CABECALHO
# ============================================================

Clear-Host
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "              PizzaShop PWA - Fase 3 (P1)" -ForegroundColor Cyan
Write-Host "        Commit + Push + PR -> integracao + Merge" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
if ($DryRun) {
    Write-Host "MODO DRY-RUN: nada sera commitado, enviado ou mergeado." -ForegroundColor Magenta
    Write-Host ""
}

# ============================================================
# VERIFICACOES
# ============================================================

Write-Host "[1/6] Verificando gh, git e login..." -ForegroundColor Yellow
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "  ! GitHub CLI (gh) nao encontrado. Instale em https://cli.github.com/" -ForegroundColor Red
    exit 1
}
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "  ! git nao encontrado no PATH." -ForegroundColor Red
    exit 1
}
gh auth status *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ! Voce nao esta logado. Rode: gh auth login" -ForegroundColor Red
    exit 1
}

git rev-parse --is-inside-work-tree *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ! Rode este script de dentro do repositorio clonado." -ForegroundColor Red
    exit 1
}

# Arvore limpa? (vamos trocar de branch)
$dirty = git status --porcelain
if (-not [string]::IsNullOrWhiteSpace($dirty)) {
    Write-Host "  ! Arvore de trabalho com alteracoes pendentes. Commite ou guarde (git stash) antes." -ForegroundColor Red
    Write-Host "    Este script troca de branch e nao quer arrastar mudancas por engano." -ForegroundColor Red
    exit 1
}

$repo = (gh repo view --json nameWithOwner --jq ".nameWithOwner").Trim()
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($repo)) {
    Write-Host "  ! Nao consegui detectar o repositorio. Rode na raiz do repo." -ForegroundColor Red
    exit 1
}
$defaultBranch = (gh repo view --json defaultBranchRef --jq ".defaultBranchRef.name").Trim()
Write-Host "  = Repo: $repo (branch padrao: $defaultBranch)" -ForegroundColor Gray

if (-not (Test-Path $SourceDir)) {
    Write-Host "  ! -SourceDir nao encontrado: $SourceDir" -ForegroundColor Red
    Write-Host "    Baixe a pasta 'backend' entregue para dentro de '$SourceDir\backend\'." -ForegroundColor Red
    exit 1
}
Write-Host "  = SourceDir: $SourceDir" -ForegroundColor Gray
Write-Host ""

# ============================================================
# MAPA: branch -> arquivos daquela etapa (SO as branches do P1)
# ============================================================
# A ordem do array e a ordem de execucao (69 antes de 70).

$plan = @(
    [ordered]@{
        Branch  = "69-fundacao-de-dados-fase-3"
        Issue   = 69
        Message = "feat(#69): fundacao de dados da Fase 3 (mesas, comandas, avaliacao, custo, canal, papel garcom)"
        Title   = "Fundacao de dados (Fase 3): mesas, comandas, avaliacao, custo e papel garcom"
        Body    = @"
Refs #69

Fundacao de dados da Fase 3 (models + migration):

- Tabelas novas: restaurant_table, tab (comanda), order_rating.
- Colunas novas em order (channel, waiter_id, table_id, tab_id) e custo em product/order_item.
- Enums novos (order_channel, table_status, tab_status) e valor 'garcom' no staff_role.
- Registro dos models novos em app/models/__init__.py.

Validado num Postgres real: alembic upgrade head do zero + seed OK.
"@
        Files   = @(
            "backend/alembic/versions/202609070001_fase3_fundacao.py",
            "backend/app/models/table.py",
            "backend/app/models/rating.py",
            "backend/app/models/order.py",
            "backend/app/models/product.py",
            "backend/app/models/staff.py",
            "backend/app/models/__init__.py"
        )
    },
    [ordered]@{
        Branch  = "70-crud-mesas-e-comandas"
        Issue   = 70
        Message = "feat(#70): CRUD de mesas e comandas (schemas, crud, rotas) + snapshot de custo"
        Title   = "CRUD de mesas e comandas (Fase 3)"
        Body    = @"
Refs #70

CRUD + rotas do presencial:

- schemas de mesa/comanda; OrderOut ganha channel/tabId; OrderItemOut ganha cost.
- crud/table.py com a regra "1 comanda aberta por mesa" e totais.
- rotas /tables e /tabs (require_role admin+garcom); registro em main.py.
- create_order congela o custo do item (snapshot); seed cria garcom, mesas e custos.

Depende da #69 (deve entrar na integracao depois dela).
Validado num Postgres real: ciclo abrir -> 409 -> lancar -> pagar OK.
"@
        Files   = @(
            "backend/app/schemas/table.py",
            "backend/app/schemas/order.py",
            "backend/app/crud/table.py",
            "backend/app/crud/order.py",
            "backend/app/routers/tables.py",
            "backend/app/routers/tabs.py",
            "backend/app/main.py",
            "backend/scripts/seed.py"
        )
    }
)

# ============================================================
# GARANTIR A BRANCH DE INTEGRACAO (base das PRs)
# ============================================================

Write-Host "[2/6] Garantindo a branch base '$BaseBranch'..." -ForegroundColor Yellow
git fetch origin *> $null
$baseRemote = git ls-remote --heads origin $BaseBranch
if ([string]::IsNullOrWhiteSpace($baseRemote)) {
    if ([string]::IsNullOrWhiteSpace($CreateBaseFrom)) {
        Write-Host "  ! '$BaseBranch' nao existe no origin e -CreateBaseFrom esta vazio." -ForegroundColor Red
        exit 1
    }
    Write-Host "  - '$BaseBranch' nao existe. Criando a partir de '$CreateBaseFrom'." -ForegroundColor Gray
    if ($DryRun) {
        Write-Host "  ~ (dry) criaria e daria push em '$BaseBranch' a partir de origin/$CreateBaseFrom" -ForegroundColor Magenta
    }
    else {
        "n" | git checkout $CreateBaseFrom | Out-Null
        git pull origin $CreateBaseFrom *> $null
        git checkout -b $BaseBranch 2>$null
        if ($LASTEXITCODE -ne 0) { "n" | git checkout $BaseBranch | Out-Null }
        git push -u origin $BaseBranch
        if ($LASTEXITCODE -ne 0) { Write-Host "  ! Falha ao criar/enviar '$BaseBranch'." -ForegroundColor Red; exit 1 }
        Write-Host "  + '$BaseBranch' criada e enviada." -ForegroundColor Green
    }
}
else {
    Write-Host "  = '$BaseBranch' ja existe no origin." -ForegroundColor DarkYellow
}
Write-Host ""

# ============================================================
# FUNCAO: processa uma branch (commit -> push -> PR -> merge)
# ============================================================

function Invoke-BranchStep {
    param($step)

    $branch = $step.Branch
    Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
    Write-Host "Branch: $branch  (issue #$($step.Issue))" -ForegroundColor Cyan

    # 1) checkout da branch (local, senao do origin)
    $localExists = git rev-parse --verify --quiet "refs/heads/$branch"
    if (-not [string]::IsNullOrWhiteSpace($localExists)) {
        "n" | git checkout $branch | Out-Null
    }
    else {
        $remoteExists = git ls-remote --heads origin $branch
        if ([string]::IsNullOrWhiteSpace($remoteExists)) {
            Write-Host "  ! Branch '$branch' nao existe (nem local, nem origin). Pulei." -ForegroundColor Red
            return
        }
        git fetch origin "${branch}:${branch}" *> $null
        "n" | git checkout $branch | Out-Null
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ! Nao consegui fazer checkout de '$branch'. Pulei." -ForegroundColor Red
        return
    }

    # 2) copiar os arquivos da etapa
    $missing = @()
    foreach ($rel in $step.Files) {
        $src = Join-Path $SourceDir $rel
        if (-not (Test-Path $src)) { $missing += $rel; continue }
        if ($DryRun) {
            Write-Host "  ~ (dry) copiaria: $rel" -ForegroundColor Magenta
        }
        else {
            $dstDir = Split-Path $rel -Parent
            if ($dstDir -and -not (Test-Path $dstDir)) { New-Item -ItemType Directory -Force -Path $dstDir | Out-Null }
            Copy-Item -Force -Path $src -Destination $rel
        }
    }
    if ($missing.Count -gt 0) {
        Write-Host "  ! Faltam arquivos em -SourceDir (nao copiados):" -ForegroundColor Red
        $missing | ForEach-Object { Write-Host "      $_" -ForegroundColor Red }
        Write-Host "    Ajuste o -SourceDir e rode de novo. Pulei o commit desta branch." -ForegroundColor Red
        return
    }

    # 3) add + commit (idempotente)
    if ($DryRun) {
        Write-Host "  ~ (dry) git add + commit: $($step.Message)" -ForegroundColor Magenta
    }
    else {
        foreach ($rel in $step.Files) { git add -- $rel | Out-Null }
        git diff --cached --quiet
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  = Nada mudou nesta branch (ja estava commitado)." -ForegroundColor DarkYellow
        }
        else {
            git commit -m $step.Message | Out-Null
            if ($LASTEXITCODE -eq 0) { Write-Host "  + Commit feito." -ForegroundColor Green }
            else { Write-Host "  ! Falha no commit." -ForegroundColor Red; return }
        }
    }

    # 4) push
    if ($DryRun) {
        Write-Host "  ~ (dry) git push -u origin $branch" -ForegroundColor Magenta
    }
    else {
        git push -u origin $branch
        if ($LASTEXITCODE -ne 0) { Write-Host "  ! Falha no push de '$branch'." -ForegroundColor Red; return }
        Write-Host "  + Push OK." -ForegroundColor Green
    }

    # 5) PR -> base (se ainda nao existe uma aberta)
    $prNumber = ""
    if (-not $DryRun) {
        $prNumber = gh pr list --repo $repo --head $branch --base $BaseBranch --state open --json number --jq ".[0].number" 2>$null
    }
    if (-not [string]::IsNullOrWhiteSpace($prNumber)) {
        Write-Host "  = PR ja aberta (#$prNumber) para $BaseBranch." -ForegroundColor DarkYellow
    }
    else {
        if ($DryRun) {
            Write-Host "  ~ (dry) abriria PR: $branch -> $BaseBranch" -ForegroundColor Magenta
        }
        else {
            # corpo via arquivo temporario (evita o bug de aspas do --body inline).
            # UTF-8 SEM BOM: foi o BOM que quebrou o --body no script anterior.
            $tmp = New-TemporaryFile
            [System.IO.File]::WriteAllText($tmp.FullName, $step.Body, (New-Object System.Text.UTF8Encoding($false)))
            gh pr create --repo $repo --base $BaseBranch --head $branch --title $step.Title --body-file $tmp.FullName 2>$null
            $ok = ($LASTEXITCODE -eq 0)
            Remove-Item $tmp.FullName -ErrorAction SilentlyContinue
            if ($ok) {
                $prNumber = gh pr list --repo $repo --head $branch --base $BaseBranch --state open --json number --jq ".[0].number" 2>$null
                Write-Host "  + PR aberta (#$prNumber) -> $BaseBranch." -ForegroundColor Green
            }
            else {
                Write-Host "  ! Falha ao abrir a PR." -ForegroundColor Red
                return
            }
        }
    }

    # 6) merge
    if ($NoMerge) {
        Write-Host "  = -NoMerge: parei antes de aceitar a PR." -ForegroundColor DarkYellow
        return
    }
    if ($DryRun) {
        Write-Host "  ~ (dry) faria merge (--$MergeMethod) da PR de $branch" -ForegroundColor Magenta
        return
    }

    $mergeArgs = @("pr", "merge", $branch, "--repo", $repo, "--$MergeMethod")
    if ($DeleteBranch) { $mergeArgs += "--delete-branch" }
    gh @mergeArgs 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  + PR mergeada em $BaseBranch." -ForegroundColor Green
    }
    else {
        Write-Host "  ! Falha ao mergear (conflito? protecao de branch? PR ja mergeada?). Confira no GitHub." -ForegroundColor Red
    }
}

# ============================================================
# EXECUCAO
# ============================================================

Write-Host "[3/6] Processando as branches do P1 (69 -> 70)..." -ForegroundColor Yellow
Write-Host ""
foreach ($step in $plan) {
    Invoke-BranchStep $step
    Write-Host ""
}

# ============================================================
# VOLTAR PRA BRANCH PADRAO E RESUMO
# ============================================================

Write-Host "[4/6] Voltando para '$defaultBranch'..." -ForegroundColor Yellow
if (-not $DryRun) { "n" | git checkout $defaultBranch | Out-Null }

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
if ($DryRun) {
    Write-Host " DRY-RUN concluido. Rode sem -DryRun para valer." -ForegroundColor Magenta
}
else {
    Write-Host " Concluido." -ForegroundColor Green
    Write-Host " PRs abertas para: $BaseBranch" -ForegroundColor Gray
    if ($NoMerge) { Write-Host " (merge NAO feito por causa de -NoMerge)" -ForegroundColor Gray }
    Write-Host " Lembrete: as issues #69/#70 NAO fecham sozinhas (base != $defaultBranch)." -ForegroundColor Gray
}
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
