# P4 — Tema claro/escuro

## Implementação

- O tema visual usa um conjunto próprio de variáveis semânticas `--ui-*`.
- As cores de marca do tenant continuam em `--color-primary` e `--color-secondary`, injetadas pelo `ThemeEditor`/`useTheme`. Elas não são alteradas pelo P4.
- A preferência é persistida em `localStorage` pela store Zustand `useColorSchemeStore`, com a chave `pizzashop:color-scheme`.
- Na primeira visita, sem preferência salva, o valor padrão é derivado de `prefers-color-scheme`.
- O modo ativo é aplicado no elemento `<html>` por `data-theme="light"` ou `data-theme="dark"` e também por `color-scheme`.
- A aplicação síncrona em `main.tsx` reduz o flash de tema durante o carregamento inicial.
- O toggle é reutilizado na loja, no painel administrativo e na tela de login do admin.

## Variáveis CSS novas

| Variável | Claro | Escuro | Uso |
|---|---|---|---|
| `--ui-bg` | `#f8f3ec` | `#171311` | fundo principal da aplicação |
| `--ui-surface` | `#ffffff` | `#211b18` | cards, painéis e superfícies |
| `--ui-surface-soft` | `#fffaf4` | `#2a211d` | superfícies secundárias |
| `--ui-text` | `#2a1a15` | `#f6eee8` | texto normal |
| `--ui-text-strong` | `#21130f` | `#fff8f3` | títulos/textos de maior contraste |
| `--ui-text-muted` | `#786b64` | `#c7b9b0` | texto secundário |
| `--ui-text-subtle` | `#9a8c85` | `#a7968c` | textos auxiliares |
| `--ui-border` | `#eaded2` | `#493b34` | bordas principais |
| `--ui-border-soft` | `#f0e7df` | `#3a302b` | divisórias suaves |
| `--ui-input-bg` | `rgba(255,255,255,.92)` | `#211b18` | campos de formulário |
| `--ui-input-focus-bg` | `#ffffff` | `#28201c` | campo em foco |
| `--ui-hover` | `#f5efe8` | `#302621` | estados hover |
| `--ui-shadow` | `0 18px 50px rgba(58,29,19,.10)` | `0 18px 50px rgba(0,0,0,.28)` | sombra de superfícies |

## Coexistência com as cores de marca do tenant

As variáveis abaixo continuam pertencendo exclusivamente ao tema white-label do tenant:

- `--color-primary`
- `--color-secondary`

O P4 **não redefine nem persiste** essas variáveis. `useTheme.ts` continua responsável por converter `tenant.primaryColor`/`tenant.secondaryColor` e injetá-las no `<html>`. Portanto, trocar claro/escuro muda somente a camada semântica da interface; botões, links e destaques que usam `primary`/`secondary` continuam vinculados à marca configurada pelo tenant.

## Persistência e comportamento padrão

1. Ao iniciar, `useColorSchemeStore` procura `pizzashop:color-scheme` no `localStorage`.
2. Se houver `light` ou `dark`, esse valor é usado.
3. Se não houver valor salvo, `window.matchMedia("(prefers-color-scheme: dark)")` define o modo inicial.
4. Ao usar o toggle, a nova escolha é salva e aplicada em `<html data-theme="...">`.

## Checklist de telas cobertas

### Loja

- [x] Landing / página inicial
- [x] Cardápio
- [x] Detalhe do produto
- [x] Carrinho
- [x] Checkout
- [x] Pagamento
- [x] Acompanhamento do pedido
- [x] Cabeçalho e rodapé da loja

### Admin

- [x] Login administrativo
- [x] Dashboard
- [x] Customização / ThemeEditor
- [x] Gerenciamento de cardápio
- [x] Gerenciamento de pedidos
- [x] Gerenciamento de entregadores
- [x] Financeiro / BI
- [x] Navegação lateral e componentes compartilhados

## Critérios de aceite P4

- [x] Paleta semântica separada das cores do tenant.
- [x] Toggle persistido em `localStorage`.
- [x] `prefers-color-scheme` usado como padrão sem preferência salva.
- [x] Tema aplicado no `<html>` por atributo `data-theme`.
- [x] Loja e admin possuem acesso ao toggle.
- [x] Login do admin também permite alterar o tema.
