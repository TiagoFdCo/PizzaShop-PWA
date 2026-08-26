import { useCartStore } from "../../store/useCartStore";

export function CartPage() {
  const {
    items,
    removeItem,
    increaseQuantity,
    decreaseQuantity,
  } = useCartStore();

  const total = items.reduce(
    (accumulator, item) =>
      accumulator + item.price * item.quantity,
    0
  );

  return (
    <div>
      <h1>Meu Carrinho</h1>

      {items.length === 0 ? (
        <p>Seu carrinho está vazio.</p>
      ) : (
        <>
          {items.map((item) => (
            <div key={item.id}>
              <h2>{item.name}</h2>

              <p>
                R$ {item.price.toFixed(2)}
              </p>

              <button
                onClick={() =>
                  decreaseQuantity(item.id)
                }
              >
                -
              </button>

              <span>
                {item.quantity}
              </span>

              <button
                onClick={() =>
                  increaseQuantity(item.id)
                }
              >
                +
              </button>

              <button
                onClick={() =>
                  removeItem(item.id)
                }
              >
                Remover
              </button>
            </div>
          ))}

          <hr />

          <h2>
            Total: R$ {total.toFixed(2)}
          </h2>

          <button>
            Ir para Checkout
          </button>
        </>
      )}
    </div>
  );
}