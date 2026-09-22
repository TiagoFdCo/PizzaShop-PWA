import { useEffect, useState } from "react";
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
// Fase 4 (P3) — cupom e fidelidade
import { CouponField } from "../../components/store/CouponField";
import { LoyaltyRedeem } from "../../components/store/LoyaltyRedeem";
import { getMyLoyalty } from "../../services/loyaltyService";
import { maxRedeemablePoints, pointsForAmount, pointsToReais } from "../../lib/loyalty";
import type { CouponValidation, LoyaltyAccount } from "../../types/loyalty";

const PAYMENT_LABELS: Record<string, string> = { pix: "Pix", cartao: "Cartão", dinheiro: "Dinheiro" };

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal } = useCartStore();
  const tenant = useTenantStore((state) => state.tenant);
  const { placeOrder, loading, error } = useOrderStore();

  const enabledMethods = tenant?.enabledPaymentMethods ?? [];
  const deliveryFee = tenant?.deliveryFee ?? 0;
  const minOrderValue = tenant?.minOrderValue ?? 0;
  const belowMinOrder = subtotal() < minOrderValue;

  // ── Fase 4 (P3): cupom + pontos ──────────────────────────────────────
  // Prévia no front; o backend recalcula tudo em POST /orders.
  const [coupon, setCoupon] = useState<CouponValidation | null>(null);
  const [loyalty, setLoyalty] = useState<LoyaltyAccount | null>(null);
  const [redeemPoints, setRedeemPoints] = useState(0);

  useEffect(() => {
    // null = sem cliente logado -> seção de pontos não aparece
    getMyLoyalty()
      .then(setLoyalty)
      .catch(() => setLoyalty(null));
  }, []);

  const couponDiscount = coupon?.discount ?? 0;
  const afterCoupon = Math.max(0, subtotal() - couponDiscount);
  // Se o cupom reduzir o valor, os pontos escolhidos são limitados na hora
  const effectiveRedeem = loyalty
    ? Math.min(redeemPoints, maxRedeemablePoints(loyalty.pointsBalance, afterCoupon, loyalty.rules))
    : 0;
  const loyaltyDiscount = loyalty ? pointsToReais(effectiveRedeem, loyalty.rules) : 0;
  const productsTotal = Math.max(0, afterCoupon - loyaltyDiscount);
  const total = productsTotal + deliveryFee;
  const pointsToEarn = loyalty ? pointsForAmount(productsTotal, loyalty.rules) : 0;
  // ────────────────────────────────────────────────────────────────────

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
    else if (belowMinOrder) navigate("/carrinho", { replace: true });
  }, [items.length, belowMinOrder, navigate]);

  async function onSubmit(data: CheckoutFormData) {
    try {
      await placeOrder({
      items,
      customer: { name: data.name, address: data.address, phone: data.phone },
      paymentMethod: data.paymentMethod,
      subtotal: subtotal(),
      deliveryFee,
      total,
      couponCode: coupon?.code ?? null,
      redeemPoints: effectiveRedeem,
      });
    } catch {
      // Fase 4 (P3): backend pode recusar (cupom esgotou, saldo mudou...).
      // A mensagem já fica em `error` do useOrderStore e aparece no form.
      return;
    }
    navigate("/pagamento");
  }

  if (items.length === 0 || belowMinOrder) return null;

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
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal())}</span>
        </div>
        {couponDiscount > 0 && (
          <div className="flex justify-between text-sm text-green-700">
            <span>Cupom {coupon?.code}</span>
            <span>−{formatCurrency(couponDiscount)}</span>
          </div>
        )}
        {loyaltyDiscount > 0 && (
          <div className="flex justify-between text-sm text-green-700">
            <span>Pontos ({effectiveRedeem})</span>
            <span>−{formatCurrency(loyaltyDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-gray-600">
          <span>Taxa de entrega</span>
          <span>{formatCurrency(deliveryFee)}</span>
        </div>
        <div className="flex justify-between font-bold text-gray-900 pt-1">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
        {pointsToEarn > 0 && (
          <p className="mt-1 text-right text-xs text-gray-500">Você vai ganhar {pointsToEarn} pontos com este pedido</p>
        )}

        {/* Fase 4 (P3) — descontos, antes do pagamento */}
        <div className="mt-4 space-y-3 border-t pt-4">
          <CouponField
            subtotal={subtotal()}
            applied={coupon}
            onApply={setCoupon}
            onRemove={() => setCoupon(null)}
          />
          {loyalty && (
            <LoyaltyRedeem
              account={loyalty}
              remainingSubtotal={afterCoupon}
              redeemPoints={effectiveRedeem}
              onChange={setRedeemPoints}
            />
          )}
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