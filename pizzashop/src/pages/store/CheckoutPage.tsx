import { useCartStore } from "../../store/useCartStore";

export function CheckoutPage() {
  const { items } = useCartStore();

  const total = items.reduce(
    (accumulator, item) =>
      accumulator + item.price * item.quantity,
    0
  );

  return (
    <div>
      <h1>Checkout</h1>

      <h2>Resumo do pedido</h2>

      {items.map((item) => (
        <div key={item.id}>
          <p>
            {item.name} - {item.quantity}x
          </p>

          <p>
            R$ {(item.price * item.quantity).toFixed(2)}
          </p>
        </div>
      ))}

      <hr />

      <h2>
        Total: R$ {total.toFixed(2)}
      </h2>

      <h2>Dados de entrega</h2>

      <form>
        <div>
          <label htmlFor="name">
            Nome
          </label>

          <input
            id="name"
            type="text"
            placeholder="Digite seu nome"
          />
        </div>

        <div>
          <label htmlFor="address">
            Endereço
          </label>

          <input
            id="address"
            type="text"
            placeholder="Digite seu endereço"
          />
        </div>

        <div>
          <label htmlFor="phone">
            Telefone
          </label>

          <input
            id="phone"
            type="tel"
            placeholder="Digite seu telefone"
          />
        </div>

        <button type="submit">
          Continuar para pagamento
        </button>
      </form>
    </div>
  );
}