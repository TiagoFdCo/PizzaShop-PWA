# P3 — Cupons de desconto e fidelidade (Fase 4)

Responsável: João Vitor Dias (`diasdasilvajoaovitor673`)

## 1. Visão geral

No checkout, **antes do pagamento**, o cliente pode:

1. digitar um **cupom** (desconto percentual ou valor fixo sobre os produtos);
2. se estiver logado, **usar pontos de fidelidade** como desconto;
3. ver quantos pontos vai **ganhar** com o pedido.

O front só mostra uma prévia. **Quem decide o desconto é o backend**: em
`POST /orders` ele valida o cupom de novo, confere o saldo de pontos e
recalcula `total` (o `total` enviado pelo front é ignorado). Se qualquer
regra falhar, nada é gravado: nem pedido, nem uso de cupom, nem pontos.

```
total = subtotal − desconto do cupom − desconto dos pontos + taxa de entrega
```

A taxa de entrega **nunca** recebe desconto e **não** gera pontos.

## 2. Regras de cupom

| Campo | Significado |
|---|---|
| `code` | 3–30 caracteres (letras, números, `_`, `-`). Salvo em MAIÚSCULAS; o cliente pode digitar em minúsculas. Único por loja. |
| `discountType` | `percentual` (valor = % do subtotal, máx. 100) ou `valor_fixo` (valor em R$). |
| `value` | Tamanho do desconto (> 0). |
| `minOrderValue` | Subtotal mínimo para o cupom valer (padrão 0). |
| `validFrom` / `validUntil` | Janela de validade. `validUntil` vazio = não expira. |
| `maxUses` | Limite total de usos. Vazio = ilimitado. `usesCount` sobe 1 a cada pedido criado com o cupom. |
| `active` | Admin pode desligar sem apagar. |

O desconto é sempre limitado ao subtotal (um cupom de R$ 50 num pedido de
R$ 30 dá R$ 30 de desconto, nunca total negativo). Percentual é arredondado
em centavos.

**Ordem de checagem** (a mensagem mostrada é a do primeiro problema):

1. não existe → `404 "Cupom não encontrado"`
2. `active = false` → `400 "Cupom desativado"`
3. antes de `validFrom` → `400 "Cupom ainda não está válido"`
4. depois de `validUntil` → `400 "Cupom expirado"`
5. `usesCount >= maxUses` → `400 "Cupom esgotado"`
6. subtotal abaixo do mínimo → `400 "Este cupom exige pedido mínimo de R$ 60,00 (faltam R$ 10,00)"`

Dois pedidos simultâneos com o último uso de um cupom não passam os dois:
a linha do cupom é travada (`SELECT ... FOR UPDATE`) até o commit.

### Exemplos (subtotal R$ 80,00)

| Cupom | Situação | Resultado |
|---|---|---|
| `PIZZA10` — percentual 10 | válido | desconto R$ 8,00 |
| `DESCONTO15` — valor_fixo 15 | válido | desconto R$ 15,00 |
| `BLACKFRIDAY` — validUntil ontem | expirado | `400 Cupom expirado` |
| `LANCAMENTO` — maxUses 50, usesCount 50 | esgotado | `400 Cupom esgotado` |
| `GRANDE20` — mínimo R$ 100 | abaixo do mínimo | `400 ... faltam R$ 20,00` |
| `XYZ123` | não cadastrado | `404 Cupom não encontrado` |

## 3. Regras de fidelidade

Constantes em `backend/app/crud/loyalty.py` (mudou lá, o front acompanha,
porque `GET /loyalty/me` devolve as regras em `rules`):

| Regra | Valor |
|---|---|
| Ganho | **1 ponto por R$ 1,00** pago em produtos (subtotal − descontos), arredondado para baixo |
| Resgate | em blocos de **100 pontos = R$ 10,00** |
| Limite do resgate | o desconto dos pontos não pode passar do que sobrou do subtotal depois do cupom |
| Quem participa | só cliente logado (token de cliente). Pedido anônimo não ganha nem resgata. |

**Exemplo completo:** saldo 350 pontos, subtotal R$ 104,80, entrega R$ 6,50,
cupom `PIZZA10`, usa 100 pontos:

```
104,80 − 10,48 (cupom) − 10,00 (100 pts) = 84,32 em produtos → ganha 84 pontos
total = 84,32 + 6,50 = R$ 90,82
saldo final = 350 − 100 + 84 = 334
```

Cada movimento vira uma linha no extrato (`loyalty_transaction`): `ganho`
(+), `resgate` (−) ou `estorno`. O saldo nunca fica negativo (há uma CHECK
constraint no banco).

**Quando os pontos entram:** na criação do pedido, junto com o débito dos
pontos usados. Se o pagamento for recusado, a função
`revert_order_discounts()` desfaz tudo (ver seção 6).

## 4. Endpoints

| Método | Rota | Acesso | Uso |
|---|---|---|---|
| POST | `/coupons/validate` | público | checkout confere o cupom. Body `{code, subtotal}` → `{code, description, discountType, value, discount}` |
| GET | `/coupons` | admin | lista cupons |
| POST | `/coupons` | admin | cria cupom (409 se o código já existe) |
| PATCH | `/coupons/{id}` | admin | muda `active`, `validUntil`, `maxUses`, `description` |
| DELETE | `/coupons/{id}` | admin | remove |
| GET | `/loyalty/rules` | público | regras de pontos |
| GET | `/loyalty/me` | cliente | saldo, total acumulado, regras e últimas 50 movimentações. 401 sem token de cliente. |
| POST | `/orders` | público | **dois campos novos opcionais**: `couponCode` e `redeemPoints` |

`OrderOut` ganhou: `couponCode`, `couponDiscount`, `loyaltyDiscount`,
`pointsRedeemed`, `pointsEarned`. Pedido sem cupom/pontos continua
funcionando exatamente como antes (campos vêm `null`/`0`).

### Tela do admin: `/admin/cupons`

O admin gerencia os cupons pelo painel, no item **Cupons** do menu lateral:

- lista todos os cupons com desconto, pedido mínimo, validade, usos
  (`3 / 100`) e status calculado: **Ativo**, **Desativado**, **Agendado**
  (ainda não começou), **Expirado** ou **Esgotado**;
- **Novo cupom**: código, descrição, tipo (% ou R$), valor, pedido mínimo,
  início/fim da validade e limite de usos (campos opcionais em branco =
  começa agora, não expira, ilimitado);
- botão de **ativar/desativar** (sem apagar o histórico) e **excluir**.

Os pedidos que já usaram um cupom guardam o código e o desconto no próprio
pedido, então excluir o cupom não altera pedidos antigos.

Também dá para criar pelo Swagger (`/docs`) ou curl:

```bash
curl -X POST http://localhost:8000/coupons \
  -H "Authorization: Bearer <token-admin>" -H "Content-Type: application/json" \
  -d '{"code":"PIZZA10","description":"10% na primeira compra","discountType":"percentual","value":10}'
```

## 5. Arquivos

### Novos
- `backend/app/models/coupon.py` — model `Coupon`
- `backend/app/models/loyalty.py` — models `LoyaltyAccount` e `LoyaltyTransaction`
- `backend/app/schemas/coupon.py`, `backend/app/schemas/loyalty.py`
- `backend/app/crud/coupon.py` — CRUD e regras de validação
- `backend/app/crud/loyalty.py` — regras de pontos e extrato
- `backend/app/crud/discount.py` — aplica cupom + pontos no pedido; `revert_order_discounts()`
- `backend/app/routers/coupons.py`, `backend/app/routers/loyalty.py`
- `backend/app/deps_customer.py` — lê o `customer_id` do token de cliente
- `backend/alembic/versions/202609220001_fase4_cupons_fidelidade.py`
- `backend/tests/test_cupons_fidelidade.py` — 22 testes
- `src/types/loyalty.ts`, `src/services/couponService.ts`, `src/services/loyaltyService.ts`
- `src/lib/loyalty.ts` — contas da prévia
- `src/components/store/CouponField.tsx`, `src/components/store/LoyaltyRedeem.tsx`
- `src/pages/admin/CouponsManagementPage.tsx` — tela `/admin/cupons`
- `src/components/admin/coupons/CouponForm.tsx`, `CouponTable.tsx`
- `src/lib/coupon.ts` (status/formatação), `src/lib/couponForm.ts` (validação do formulário)
- `tests/unit/loyalty.test.ts`, `tests/unit/coupon.test.ts`
- `tests/components/CouponField.test.tsx`, `tests/components/CouponsManagementPage.test.tsx`

### Alterados (mudanças pequenas e marcadas com `Fase 4 (P3)` no código)
- `backend/app/models/__init__.py` — registra os models novos
- `backend/app/models/order.py` — 5 colunas de desconto no `Order`
- `backend/app/schemas/order.py` — `couponCode`/`redeemPoints` no input, campos novos no `OrderOut`
- `backend/app/crud/order.py` — `create_order` chama `apply_order_discounts` antes do commit
- `backend/app/routers/orders.py` — `POST /orders` lê o cliente (opcional) e devolve os campos novos
- `backend/app/main.py` — registra os routers `coupons` e `loyalty`
- `src/types/order.ts`, `src/services/orderService.ts` — campos novos (opcionais)
- `src/pages/store/CheckoutPage.tsx` — cupom, pontos e resumo com descontos
- `src/components/layout/AdminLayout.tsx` — item "Cupons" no menu
- `src/router.tsx` — rota `/admin/cupons`

## 6. Integração com as outras frentes

**P1 — login de cliente (dependência real).** A fidelidade precisa saber
quem é o cliente. Para não travar esperando, `deps_customer.py` lê o
`customer_id` direto do JWT, assumindo este contrato:

- token de cliente assinado com o mesmo `JWT_SECRET`/`create_access_token`;
- `sub` = `customer.id` e `role` = `"customer"` (aceito também `"cliente"`).

Se o P1 usar outro `role`, é só mudar `CUSTOMER_ROLES` nesse arquivo.
No front, `getMyLoyalty()` usa o token que estiver no `apiFetch`
(`setAuthToken`); quando o P1 fizer o login de cliente chamar
`setAuthToken(token)`, a seção de pontos aparece sozinha no checkout.

`loyalty_account.customer_id` está **sem FK** de propósito (a tabela
`customer` é do P1). Depois do merge dele, uma migration de 3 linhas adiciona:

```python
op.create_foreign_key("fk_loyalty_customer", "loyalty_account", "customer",
                      ["customer_id"], ["id"], ondelete="CASCADE")
```

**P1 — pagamento concreto.** O total que deve ser cobrado é `order.total`
(já com descontos). Quando o pagamento for **recusado**, chamar:

```python
from app.crud.discount import revert_order_discounts
revert_order_discounts(db, order)   # devolve o uso do cupom e os pontos
db.commit()
```

É idempotente (chamar duas vezes não estorna duas vezes). Na tela de sucesso
do pagamento, dá para mostrar `lastOrder.pointsEarned`.

Os dois mexemos no `CheckoutPage.tsx`; minha parte ficou em blocos
separados e comentados, e a lógica visual está em componentes próprios,
para o merge ser simples.

**Migrations (todos).** Esta migration parte de `202609110001`. Se P1/P5
também criarem migrations a partir dela, o Alembic acusa *multiple heads*:
quem fizer merge por último ajusta o `down_revision` para a migration do
colega (ou roda `alembic merge heads`).

**P5 — seed.** Sugestão de cupons de demo para o `seed.py`:

```python
from app.models.coupon import Coupon, CouponDiscountType
db.add_all([
    Coupon(tenant_id=tenant.id, code="PIZZA10", description="10% de desconto",
           discount_type=CouponDiscountType.percentual, value=10),
    Coupon(tenant_id=tenant.id, code="FRETE15", description="R$ 15 off acima de R$ 60",
           discount_type=CouponDiscountType.valor_fixo, value=15, min_order_value=60),
])
```

## 7. Como testar

```bash
cd backend
alembic upgrade head
python -m scripts.seed
pytest tests/test_cupons_fidelidade.py -v     # 22 testes do P3
pytest tests/ -q                              # suíte inteira (41)

cd ..
npm test                                      # inclui loyalty e CouponField
```

Os testes de backend apagam os cupons que criam ao terminar.

Manual: em `/admin/cupons` (admin / admin123) crie `PIZZA10`, adicione pizzas ao carrinho, vá ao
checkout, digite `pizza10` e veja o desconto no resumo. Teste também um
código inexistente para ver a mensagem de erro. A seção de pontos só
aparece com cliente logado (depende do login do P1).
