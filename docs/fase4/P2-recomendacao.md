# P2 — Recomendações na Home

## Objetivo

A funcionalidade de recomendações tem como objetivo apresentar produtos relevantes ao cliente na página inicial da aplicação. Foram implementadas duas formas de recomendação: produtos presentes no último pedido do cliente logado e produtos mais pedidos de acordo com o dia da semana atual.

As recomendações são disponibilizadas pelo backend e consumidas pelo frontend por meio de serviços específicos. Na Home, os produtos são apresentados em cards e podem ser selecionados pelo cliente para acessar a página de detalhes do produto.

## 1. Recomendação baseada no último pedido

A primeira regra utiliza o histórico de pedidos do cliente autenticado.

O cliente é identificado pelo `customer_id` associado ao seu pedido. A função `get_last_order_products`, localizada em `backend/app/crud/recommendation.py`, busca o pedido mais recente desse cliente e retorna os produtos presentes nesse pedido.

A rota utilizada é:

`GET /recommendations/last-order`

Essa rota exige autenticação do cliente. O token utilizado no login identifica o cliente e permite que o backend busque somente os produtos relacionados ao seu próprio histórico.

### Funcionamento

1. O cliente realiza login.
2. O backend identifica o `customer_id` por meio do token de autenticação.
3. É localizado o pedido mais recente desse cliente.
4. Os produtos presentes nesse pedido são recuperados.
5. Os produtos são enviados para o frontend.
6. A Home apresenta a seção "Do seu último pedido".

Caso o cliente ainda não tenha realizado nenhum pedido, a função retorna uma lista vazia. Nesse caso, a seção de último pedido não é exibida na Home.

## 2. Recomendação por dia da semana

A segunda regra utiliza a popularidade dos produtos de acordo com o dia da semana.

A função `get_products_by_weekday`, localizada em `backend/app/crud/recommendation.py`, consulta os pedidos realizados no dia da semana atual e soma a quantidade de cada produto vendido. Os produtos são então ordenados pela quantidade total de unidades pedidas.

A rota utilizada é:

`GET /recommendations/weekday`

Essa rota identifica o dia da semana atual e retorna até quatro produtos mais pedidos naquele dia.

### Funcionamento

1. O backend identifica o dia da semana atual.
2. Os pedidos do tenant correspondentes a esse dia são filtrados.
3. A quantidade de cada produto vendido é somada.
4. Os produtos são ordenados pela quantidade de pedidos.
5. Até quatro produtos são retornados para o frontend.
6. A Home apresenta a seção "Mais pedidos hoje".

### Fallback

Caso não existam pedidos registrados para o dia da semana atual, o sistema utiliza como fallback a popularidade geral dos produtos.

Nesse caso, a função `get_popular_products` é utilizada para buscar os produtos mais pedidos de forma geral. Se ainda houver menos produtos disponíveis do que o limite solicitado, produtos adicionais do catálogo podem ser utilizados para completar a recomendação.

Esse fallback evita que a seção fique vazia quando ainda não existe histórico suficiente para o dia atual.

## 3. Integração com o frontend

No frontend foi criado o serviço:

`src/services/recommendationService.ts`

Esse serviço disponibiliza as funções:

* `getLastOrderRecommendations()`
* `getWeekdayRecommendations()`

Também foi criado o componente:

`src/components/store/RecommendationSection.tsx`

Esse componente realiza as consultas à API e organiza as recomendações em duas seções.

Para a apresentação individual dos produtos foi criado:

`src/components/store/RecommendationCard.tsx`

Cada card apresenta a imagem, o nome e o preço do produto. Ao selecionar um produto, o cliente é direcionado para sua página de detalhes.

A seção de recomendações foi integrada à:

`src/pages/store/LandingPage.tsx`

ficando posicionada entre as informações da loja e o banner final da página inicial.

## 4. Comportamento para clientes não autenticados

A recomendação baseada no último pedido depende da identificação do cliente e, portanto, somente é consultada quando existe um cliente autenticado.

Para usuários não autenticados, essa seção não é exibida.

A recomendação por dia da semana não depende da autenticação do cliente e pode ser apresentada normalmente na Home.

## 5. Endpoints implementados

| Método | Endpoint                      | Função                                       |
| ------ | ----------------------------- | -------------------------------------------- |
| GET    | `/recommendations/last-order` | Produtos do último pedido do cliente         |
| GET    | `/recommendations/weekday`    | Produtos mais pedidos no dia da semana atual |

## 6. Arquivos principais

### Backend

* `backend/app/crud/recommendation.py`
* `backend/app/routers/recommendations.py`
* `backend/app/schemas/recommendation.py`

### Frontend

* `src/services/recommendationService.ts`
* `src/components/store/RecommendationSection.tsx`
* `src/components/store/RecommendationCard.tsx`
* `src/pages/store/LandingPage.tsx`

## 7. Validação

A implementação foi validada com a compilação de produção do frontend utilizando:

`npm run build`

O build foi concluído com sucesso, confirmando a compilação do TypeScript e a geração dos arquivos de produção pelo Vite.

A validação dos dados reais das recomendações depende da conexão com o banco de dados utilizado pelo ambiente da aplicação.
