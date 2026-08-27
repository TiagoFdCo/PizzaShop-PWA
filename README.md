# PizzaShop PWA

E-commerce white-label de pizzas: um único código atende N pizzarias, já que tudo que muda entre clientes (cores, logo, cardápio, taxas, pagamentos) vive no `tenantConfig`, consumido em tempo real por toda a loja.

## Como rodar

```bash
npm install
```

O projeto precisa de **dois processos** rodando ao mesmo tempo, em dois terminais:

```bash
# terminal 1 — API mock (json-server), na porta 3001
npm run mock-api

# terminal 2 — app React, na porta 5173
npm run dev
```

Abra `http://localhost:5173`.

- **Loja (cliente):** `/`, `/cardapio`, `/carrinho`, `/checkout`, `/pagamento`, `/pedido/:id`
- **Painel (admin):** `/admin` — login: `admin` / `pizzashop123`

A API mock (`db.json`, servida pelo `json-server`) expõe:
- `GET/PUT /tenant` — configuração white-label (fonte única de verdade)
- `GET/POST/PUT/DELETE /products` — cardápio
- `GET/POST/PATCH /orders` — pedidos (admin escreve o status, cliente lê via polling)

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | sobe o app em modo desenvolvimento |
| `npm run mock-api` | sobe a API REST mock (json-server) na porta 3001 |
| `npm run build` | build de produção (TypeScript + Vite) |
| `npm run preview` | serve o build de produção localmente |
| `npm test` | roda a suíte de testes (Vitest + Testing Library) uma vez |
| `npm run test:watch` | testes em modo watch |
| `npm run lint` | ESLint |

## PWA

O app é instalável (manifest + service worker via `vite-plugin-pwa`) e mantém o cardápio e a configuração da loja em cache (`StaleWhileRevalidate`) para funcionamento offline em modo leitura. Para testar o comportamento real de PWA (instalação, cache), rode `npm run build && npm run preview` — o service worker não é registrado em modo `dev`.

## Estrutura

Ver `types/`, `services/`, `store/`, `hooks/`, `context/`, `components/`, `pages/`, `lib/` dentro de `src/` — cada camada tem uma responsabilidade única (tipos → chamadas de API → estado global → composição de UI). Detalhes de arquitetura no plano de execução do projeto.

## Testes

`tests/unit/` cobre `lib/` e `store/useCartStore`; `tests/components/` cobre componentes de UI (`ProductCard`, `OrderStatusTracker`) com Testing Library.
