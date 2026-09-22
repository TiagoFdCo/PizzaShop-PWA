# Fase 4 — P1: Login de cliente + validação de CPF

## Modelo de dados — `Customer`

Tabela `customer` (`backend/app/models/customer.py`):

| Coluna          | Tipo          | Observações                                   |
|-----------------|---------------|------------------------------------------------|
| `id`            | `String(36)`  | UUID, PK                                        |
| `name`          | `String(120)` |                                                  |
| `phone`         | `String(30)`  |                                                  |
| `cpf`           | `String(11)`  | único, indexado, salvo **só com dígitos**       |
| `password_hash` | `String(255)` | bcrypt, nunca sai em nenhuma resposta           |
| `cep`           | `String(8)`   | só dígitos                                      |
| `street`        | `String(180)` | vem da busca de CEP (ver abaixo)                |
| `number`        | `String(20)`  | digitado pelo cliente                           |
| `complement`    | `String(120)` | opcional, digitado pelo cliente                 |
| `neighborhood`  | `String(120)` | vem da busca de CEP                             |
| `city`          | `String(120)` | vem da busca de CEP                             |
| `state`         | `String(2)`   | UF, vem da busca de CEP                         |
| `created_at`    | `DateTime`    |                                                  |

### Endereço via CEP (ViaCEP)

O cadastro não pede rua/bairro/cidade digitados — o cliente informa o CEP,
`src/services/cepService.ts` consulta `https://viacep.com.br/ws/{cep}/json/`
(API pública brasileira, gratuita, sem chave) no `onBlur` do campo, e
`CustomerRegisterPage.tsx` preenche `street`/`neighborhood`/`city`/`state`
automaticamente (campos `readOnly` no formulário — só CEP, número e
complemento são digitados). O backend valida o CEP de novo no schema
(`CustomerRegister`, 8 dígitos) como defesa contra requisição direta à API
sem passar pela busca.

`Order` ganhou uma coluna nova, nullable: `customer_id` (FK para `customer.id`,
`ON DELETE SET NULL`). Fica **nulo em pedido de convidado** (sem login) — o
fluxo de checkout sem conta continua funcionando exatamente como antes.
Quando o cliente está logado, o pedido é associado automaticamente (ver
"Como o front consome", abaixo), e é esse campo que destrava:

- **P2** — "último pedido do cliente logado" (filtra `Order` por `customer_id`)
- **P3** — fidelidade (liga `LoyaltyAccount` ao `Customer`)

Migração: `backend/alembic/versions/202609200001_fase4_cliente_pagamento.py`
(cria `customer`, adiciona `order.customer_id`, e também cria `payment` — ver
o outro documento desta fase).

## Endpoints

### `POST /auth/customer/register`

```json
// Request
{
  "name": "...", "phone": "...", "cpf": "529.982.247-25", "password": "...",
  "cep": "69000-000", "street": "Rua Teste", "number": "123",
  "complement": "Apto 1", "neighborhood": "Centro", "city": "Manaus", "state": "AM"
}

// Response 201
{
  "accessToken": "eyJ...",
  "tokenType": "bearer",
  "customer": {
    "id": "...", "name": "...", "phone": "...", "cpf": "52998224725",
    "cep": "69000000", "street": "Rua Teste", "number": "123",
    "complement": "Apto 1", "neighborhood": "Centro", "city": "Manaus", "state": "AM"
  }
}
```

- CPF é validado (algoritmo mod 11) e normalizado (só dígitos) no schema
  Pydantic (`CustomerRegister`, `app/schemas/customer.py`) — aceita com ou
  sem máscara na entrada, mas erro `422` se o CPF for inválido.
- Senha precisa ter ao menos 6 caracteres.
- CPF duplicado → `400` com `detail: "Já existe um cliente cadastrado com este CPF."`

### `POST /auth/customer/login`

```json
// Request
{ "cpf": "529.982.247-25", "password": "..." }

// Response 200 — mesmo formato do register
```

- Credenciais inválidas → `401`.

### Autenticação nas rotas seguintes

O token devolvido vai no header `Authorization: Bearer <token>`, igual ao
fluxo de staff — só que com um claim a mais, `"type": "customer"`, que é o
que diferencia os dois tokens em `app/deps.py`:

- `get_current_customer` — exige login (levanta `401` se não houver token
  válido de cliente). Não está em uso em nenhuma rota ainda nesta fase —
  fica pronta pra quando P2/P3 precisarem de uma rota que **exija** login
  (ex.: "meu histórico completo").
- `get_optional_customer` — não levanta erro; devolve o `Customer` se o
  header trouxer um token válido de cliente, ou `None` caso contrário. É o
  que `POST /orders` usa hoje, pra continuar aceitando checkout de
  convidado.

## Como testar

```bash
# Cadastro
curl -X POST http://localhost:8000/auth/customer/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Maria Silva","phone":"92999990000","cpf":"529.982.247-25","password":"123456"}'

# Login
curl -X POST http://localhost:8000/auth/customer/login \
  -H "Content-Type: application/json" \
  -d '{"cpf":"52998224725","password":"123456"}'

# Pedido associado ao cliente logado (Authorization opcional)
curl -X POST http://localhost:8000/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken do login>" \
  -d '{ ... payload de OrderInput ... }'
# -> a resposta (OrderOut) vem com "customerId" preenchido
```

CPF `529.982.247-25` é só um exemplo válido pelo algoritmo (usado em
material didático) — qualquer CPF que passe no mod 11 funciona.

## Front-end

- `src/lib/validators.ts` — `isValidCpf()` (mesmo algoritmo do backend,
  reimplementado em TS pra dar feedback imediato no formulário sem round-trip),
  `customerRegisterSchema`, `customerLoginSchema`.
- `src/services/customerAuthService.ts` — `registerCustomer`, `loginCustomer`,
  `logoutCustomer`.
- `src/store/useCustomerAuthStore.ts` — sessão do cliente (zustand +
  persist), mesmo padrão do `useAuthStore` (staff).
- `src/pages/store/CustomerLoginPage.tsx` e `CustomerRegisterPage.tsx` —
  rotas `/conta/entrar` e `/conta/cadastro`.
- `CheckoutPage.tsx` pré-preenche nome/telefone se o cliente estiver logado,
  e mostra um link para login quando não está — mas **login não é
  obrigatório pra comprar**, o checkout de convidado continua igual.

### Limitação conhecida

`src/services/api.ts` guarda um único token ativo por aba (`authToken`).
Cliente (loja) e staff (admin) são sessões separadas mas **compartilham essa
mesma variável** — se alguém logar como staff e como cliente na mesma aba,
o login mais recente sobrescreve o token do outro nas próximas chamadas.
Na prática loja e admin não costumam ser usados na mesma aba ao mesmo
tempo, mas vale saber disso se isso mudar (ex.: um painel que mistura as
duas coisas).
