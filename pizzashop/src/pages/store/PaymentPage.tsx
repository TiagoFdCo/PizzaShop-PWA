import { useState } from "react";
import { useCartStore } from "../../store/useCartStore";

export function PaymentPage() {
  const [paymentMethod, setPaymentMethod] =
    useState("pix");

  const { items, clearCart } =
    useCartStore();

  const total = items.reduce(
    (accumulator, item) =>
      accumulator + item.price * item.quantity,
    0
  );

  function handlePayment() {
    if (items.length === 0) {
      alert("Seu carrinho está vazio.");
      return;
    }

    alert(
      `Pagamento realizado com sucesso via ${paymentMethod}!`
    );

    clearCart();
  }

  return (
    <div>
      <h1>Pagamento</h1>

      <h2>
        Total: R$ {total.toFixed(2)}
      </h2>

      <div>
        <label>
          <input
            type="radio"
            value="pix"
            checked={paymentMethod === "pix"}
            onChange={(event) =>
              setPaymentMethod(event.target.value)
            }
          />

          PIX
        </label>

        <label>
          <input
            type="radio"
            value="cartao"
            checked={paymentMethod === "cartao"}
            onChange={(event) =>
              setPaymentMethod(event.target.value)
            }
          />

          Cartão
        </label>

        <label>
          <input
            type="radio"
            value="dinheiro"
            checked={paymentMethod === "dinheiro"}
            onChange={(event) =>
              setPaymentMethod(event.target.value)
            }
          />

          Dinheiro
        </label>
      </div>

      <button onClick={handlePayment}>
        Confirmar pagamento
      </button>
    </div>
  );
}