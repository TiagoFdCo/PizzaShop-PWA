# Fase 4 — P1: Pagamento concreto (Mercado Pago — Checkout Pro)

## O que mudou

Antes, `PaymentPage.tsx` decidia sucesso/falha com `Math.random()` num
`setTimeout` local — nada tocava o backend. Numa segunda iteração, o
backend passou a decidir isso (também por sorteio, mas registrado).
**Agora o pagamento é real**, processado pelo Mercado Pago (modo de teste,
sandbox) via **Checkout Pro** — o fluxo hospedado deles, sem cartão
nenhum passando pelo nosso backend.

`dinheiro` (pagar na entrega) continua sendo aprovado na hora, localmente —
não existe o que cobrar num gateway pra isso.

## 1. Gerando as credenciais de teste (passo a passo)

1. Crie uma conta em https://www.mercadopago.com.br (pode ser pessoal —
   não precisa de CNPJ pra credenciais de teste).
2. Acesse o painel de desenvolvedor:
   https://www.mercadopago.com.br/developers/panel/app
3. Clique em **"Criar aplicação"** — nome livre (ex. "PizzaShop"),
   modelo de integração **"Pagamentos online"** → **"Checkout Pro"**.
4. Dentro da aplicação criada, vá em **"Credenciais de teste"** (aba ao
   lado de "Credenciais de produção"). Copie:
   - **Public Key** → `MP_PUBLIC_KEY` (não é usada pelo backend nesta
     integração — Checkout Pro é hospedado —, mas fica salva pra uso
     futuro, ex. se algum dia usarem o Payment Brick embutido).
   - **Access Token** → `MP_ACCESS_TOKEN` — **essa é a que o backend usa**.
5. (Opcional, recomendado pra testar o fluxo completo) Crie **contas de
   teste** em "Contas de teste" no mesmo painel — uma de vendedor (já é a
   sua conta com as credenciais acima) e uma de comprador (pra simular
   quem paga, com saldo fictício). Sem isso, dá pra usar direto os
   **cartões de teste** do Mercado Pago:
   https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/your-integrations/test/cards
   (ex. Mastercard `5031 4332 1540 6351`, qualquer CVV, validade futura,
   nome do titular `APRO` = aprova, `OTHE` = recusa).

Cole as duas credenciais no `.env` (ver `.env.example`):

```env
MP_ACCESS_TOKEN=TEST-xxxxxxxxxxxxxxxxxxxx
MP_PUBLIC_KEY=TEST-xxxxxxxxxxxxxxxxxxxx
```

## 2. Webhook em desenvolvimento local — precisa de URL pública

O Mercado Pago confirma o pagamento chamando o backend
(`notification_url`) — e "chamando" significa uma requisição de fora pra
dentro, então `http://localhost:8000` **não funciona** nessa direção.

Pra testar localmente, exponha o backend com um túnel, ex.
[ngrok](https://ngrok.com/):

```bash
ngrok http 8000
```

Isso dá uma URL tipo `https://abcd1234.ngrok-free.app`. Coloque ela no
`.env`:

```env
BACKEND_URL=https://abcd1234.ngrok-free.app
FRONTEND_URL=http://localhost:5173
```

(`FRONTEND_URL` pode continuar local — é só pra onde o **navegador** do
cliente volta depois de pagar, isso já é redirecionamento normal do
navegador, não precisa ser público.)

Em produção, `BACKEND_URL`/`FRONTEND_URL` são os domínios reais — nenhuma
mudança de código.

## Modelo de dados — `Payment`

Tabela `payment` (`backend/app/models/payment.py`), 1:1 com `Order`:

| Coluna             | Tipo         | Observações                                              |
|---------------------|--------------|------------------------------------------------------------|
| `id`                | `String(36)` | UUID, PK                                                    |
| `order_id`          | `String(36)` | FK `order.id`, único                                        |
| `method`            | enum         | `pix` \| `cartao` \| `dinheiro`                             |
| `status`            | enum         | `pendente` \| `aprovado` \| `recusado`                      |
| `transaction_id`    | `String(60)` | id interno nosso (`TXN-...` ou `CASH-...`)                  |
| `mp_preference_id`  | `String(80)` | id da preferência no Mercado Pago (nulo em "dinheiro")      |
| `mp_payment_id`     | `String(40)` | id do pagamento no Mercado Pago, preenchido pelo webhook    |
| `created_at`/`updated_at` | `DateTime` |                                                          |

## Fluxo completo

```
Checkout → POST /orders (cria Order, status "recebido")
        → navega pra /pagamento

/pagamento (1ª vez, sem parâmetros de retorno):
  "dinheiro"        → POST /orders/{id}/payment aprova na hora, sem Mercado Pago
  "pix" / "cartão"  → POST /orders/{id}/payment cria uma preferência no MP
                       → devolve initPoint → front redireciona o navegador
                         (window.location.href) pro Checkout Pro

[cliente paga no site do Mercado Pago — cartão de teste ou conta de teste]

Mercado Pago:
  a) chama o webhook (notification_url) → POST /payments/webhook
     → backend busca o pagamento de VERDADE na API do MP (nunca confia
       em query string) → atualiza o Payment (aprovado/recusado)
  b) redireciona o navegador de volta pro FRONTEND_URL/pagamento
     (com parâmetros como ?status=approved&payment_id=...)

/pagamento (retorno, com parâmetros):
  → front NÃO confia nesses parâmetros pra decidir o resultado — eles só
    servem de sinal "acabei de voltar do gateway"
  → faz polling em GET /orders/{id}/payment (a cada 2s, até 15x) até o
    status virar "aprovado" ou "recusado" (o webhook já deve ter
    atualizado a essa altura — na prática costuma já estar pronto no
    primeiro poll)
  → se depois de 30s ainda estiver "pendente", mostra "ainda
    confirmando", com botão pra checar de novo (sem desistir/declarar
    falha por conta própria)
```

Por que polling em vez de confiar direto nos parâmetros da URL de
retorno? Porque esses parâmetros vêm do **navegador do cliente**, que pode
ser adulterado — o webhook (servidor-a-servidor, verificado contra a API
do próprio Mercado Pago) é a única fonte confiável do resultado.

## Endpoints

### `POST /orders/{id}/payment`

Cria ou reinicia (retry) o pagamento do pedido.

```json
// Response — pix/cartão, recém-criado
{
  "id": "...", "orderId": "...", "method": "pix", "status": "pendente",
  "transactionId": "TXN-A1B2C3D4E5F6",
  "initPoint": "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=...",
  "createdAt": "...", "updatedAt": "..."
}

// Response — dinheiro
{
  "id": "...", "orderId": "...", "method": "dinheiro", "status": "aprovado",
  "transactionId": "CASH-A1B2C3D4E5", "initPoint": null,
  "createdAt": "...", "updatedAt": "..."
}
```

- Já aprovado antes → devolve o mesmo registro, `initPoint: null` (não
  reprocessa, não gera novo redirecionamento).
- `MP_ACCESS_TOKEN` não configurado → `500`, com a mensagem explicando o
  que falta (a mesma do passo 1 deste doc).
- Pedido inexistente → `404`.

### `GET /orders/{id}/payment`

Só consulta (usado no polling) — mesmo formato, sem reprocessar nada.

### `POST /payments/webhook`

Chamado **pelo Mercado Pago**, nunca pelo front. Não exige autenticação
(não tem como o Mercado Pago mandar nosso JWT). Sempre responde `200`
mesmo em notificações que não reconhece — devolver erro faz o Mercado
Pago reagendar e insistir, e desativar o webhook depois de várias falhas
seguidas.

## Como testar

1. Configure `.env` (passo 1) e rode `ngrok http 8000` (passo 2) se for
   testar localmente. Suba o backend com `MP_ACCESS_TOKEN`/`BACKEND_URL`
   apontando pro túnel.
2. Faça um pedido pelo front até chegar em `/pagamento`, escolhendo Pix ou
   Cartão.
3. O navegador é redirecionado pro Checkout Pro. Use um [cartão de
   teste](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/your-integrations/test/cards)
   (nome do titular `APRO` aprova, `OTHE` recusa) ou pague com a conta de
   teste de comprador.
4. Você volta pra `/pagamento` — a tela mostra "Confirmando..." por
   alguns segundos (polling) e depois o resultado final.
5. Pra conferir o webhook direto: `GET /orders/{id}/payment` deve
   mostrar `mp_payment_id` preenchido depois do pagamento (via
   `GET /orders/{id}/payment` mesmo, ou inspecionando o banco).

## Front-end

- `src/services/paymentService.ts` — `startPayment` (cria/reinicia,
  pode devolver `initPoint`) e `getPayment` (só consulta).
- `src/pages/store/PaymentPage.tsx` — estados `redirecting` → (sai da SPA
  pro Mercado Pago) → volta em `confirming` (polling) → `success` /
  `failure` / `timeout` (ainda não confirmado depois de 30s).
- `src/types/payment.ts` — `Payment.initPoint`.
