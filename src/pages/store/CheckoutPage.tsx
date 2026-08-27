import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import { useCartStore } from "../../store/useCartStore";
import { useTenantStore } from "../../store/useTenantStore";
import { useOrderStore } from "../../store/useOrderStore";
import { checkoutSchema, type CheckoutFormData } from "../../lib/validators";
import { formatCurrency } from "../../lib/formatCurrency";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

const PAYMENT_LABELS: Record<string, string> = { pix: "Pix", cartao: "Cartão", dinheiro: "Dinheiro" };

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal } = useCartStore();
  const tenant = useTenantStore((state) => state.tenant);
  const { placeOrder, loading, error } = useOrderStore();

  const enabledMethods = tenant?.enabledPaymentMethods ?? [];
  const deliveryFee = tenant?.deliveryFee ?? 0;
  const total = subtotal() + deliveryFee;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { paymentMethod: enabledMethods[0] },
  });

  useEffect(() => {
    if (items.length === 0) navigate("/carrinho", { replace: true });
  }, [items.length, navigate]);

  async function onSubmit(data: CheckoutFormData) {
    await placeOrder({
      items,
      customer: { name: data.name, address: data.address, phone: data.phone },
      paymentMethod: data.paymentMethod,
      subtotal: subtotal(),
      deliveryFee,
      total,
    });
    navigate("/pagamento");
  }

  if (items.length === 0) return null;

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Checkout</h1>

      <div className="card mb-6">
        <h2 className="font-semibold text-gray-800 mb-2">Resumo do pedido</h2>
        {items.map((item) => (
          <div key={item.cartItemId} className="flex justify-between text-sm text-gray-600 py-1">
            <span>
              {item.name} ({item.size}) x{item.quantity}
            </span>
            <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm text-gray-600 pt-2 mt-2 border-t">
          <span>Taxa de entrega</span>
          <span>{formatCurrency(deliveryFee)}</span>
        </div>
        <div className="flex justify-between font-bold text-gray-900 pt-1">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
        <h2 className="font-semibold text-gray-800">Dados de entrega</h2>

        <Input label="Nome completo" placeholder="Digite seu nome" {...register("name")} error={errors.name?.message} />
        <Input label="Endereço" placeholder="Rua, número, bairro" {...register("address")} error={errors.address?.message} />
        <Input label="Telefone" type="tel" placeholder="(00) 00000-0000" {...register("phone")} error={errors.phone?.message} />

        <div>
          <span className="mb-1 block text-sm font-medium text-gray-700">Forma de pagamento</span>
          {enabledMethods.length === 0 ? (
            <p className="text-sm text-amber-600">Nenhuma forma de pagamento habilitada pela loja no momento.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {enabledMethods.map((method) => (
                <label key={method} className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="radio" value={method} {...register("paymentMethod")} className="h-4 w-4 accent-primary" />
                  {PAYMENT_LABELS[method]}
                </label>
              ))}
            </div>
          )}
          {errors.paymentMethod && <p className="mt-1 text-xs text-red-500">{errors.paymentMethod.message}</p>}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading || enabledMethods.length === 0}>
          {loading ? "Enviando pedido..." : "Continuar para pagamento"}
        </Button>

        <Link to="/carrinho" className="block text-center text-sm text-gray-500 hover:text-primary">
          Voltar ao carrinho
        </Link>
      </form>
    </div>
  );
}
