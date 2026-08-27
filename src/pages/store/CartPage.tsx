import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore } from "../../store/useCartStore";
import { useTenantStore } from "../../store/useTenantStore";
import { formatCurrency } from "../../lib/formatCurrency";
import { Button } from "../../components/ui/Button";

export function CartPage() {
  const navigate = useNavigate();
  const { items, removeItem, increaseQuantity, decreaseQuantity, subtotal } = useCartStore();
  const tenant = useTenantStore((state) => state.tenant);

  const deliveryFee = tenant?.deliveryFee ?? 0;
  const total = subtotal() + deliveryFee;

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Meu Carrinho</h1>

      {items.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">Seu carrinho está vazio.</p>
          <Link to="/cardapio" className="btn-primary">
            Ver cardápio
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <div key={item.cartItemId} className="card flex gap-3">
                <img src={item.imageUrl} alt={item.name} className="h-16 w-16 rounded-lg object-cover" />
                <div className="flex-1">
                  <h2 className="font-semibold text-gray-900">
                    {item.name} <span className="text-gray-400 font-normal">({item.size})</span>
                  </h2>
                  {item.toppings.length > 0 && (
                    <p className="text-xs text-gray-500">{item.toppings.map((t) => t.name).join(", ")}</p>
                  )}
                  {item.notes && <p className="text-xs italic text-gray-400">Obs: {item.notes}</p>}
                  <p className="mt-1 font-semibold text-primary">{formatCurrency(item.unitPrice)}</p>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => removeItem(item.cartItemId)}
                    aria-label={`Remover ${item.name}`}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={18} />
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => decreaseQuantity(item.cartItemId)}
                      aria-label="Diminuir quantidade"
                      className="rounded-full border p-1 hover:bg-gray-50"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-5 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => increaseQuantity(item.cartItemId)}
                      aria-label="Aumentar quantidade"
                      className="rounded-full border p-1 hover:bg-gray-50"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card mt-6 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal())}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Taxa de entrega</span>
              <span>{formatCurrency(deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <Button className="mt-4 w-full" onClick={() => navigate("/checkout")}>
            Ir para Checkout
          </Button>
        </>
      )}
    </div>
  );
}
