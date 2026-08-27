import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import { useOrderStore } from "../../store/useOrderStore";
import { useCartStore } from "../../store/useCartStore";
import { formatCurrency } from "../../lib/formatCurrency";
import { Spinner } from "../../components/ui/Spinner";
import { Button } from "../../components/ui/Button";

type GatewayState = "processing" | "success" | "failure";

const PAYMENT_LABELS: Record<string, string> = { pix: "Pix", cartao: "Cartão", dinheiro: "Dinheiro" };

export function PaymentPage() {
  const navigate = useNavigate();
  const { lastOrder } = useOrderStore();
  const clearCart = useCartStore((state) => state.clearCart);
  const [gatewayState, setGatewayState] = useState<GatewayState>("processing");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!lastOrder) {
      navigate("/carrinho", { replace: true });
      return;
    }

    // Simulação realista de gateway de pagamento: tela de processamento -> sucesso/falha
    const timer = setTimeout(() => {
      const succeeded = Math.random() > 0.1; // ~90% de sucesso, para o fluxo de falha ser demonstrável
      setGatewayState(succeeded ? "success" : "failure");
      if (succeeded) clearCart();
    }, 1800);

    return () => clearTimeout(timer);
  }, [lastOrder, navigate, clearCart, attempt]);

  function handleRetry() {
    setGatewayState("processing");
    setAttempt((a) => a + 1);
  }

  if (!lastOrder) return null;

  if (gatewayState === "processing") {
    return (
      <div className="mx-auto max-w-md p-4">
        <div className="card mt-10 text-center">
          <Spinner label={`Processando pagamento via ${PAYMENT_LABELS[lastOrder.paymentMethod]}...`} />
          <p className="text-sm text-gray-500">Não feche esta página.</p>
        </div>
      </div>
    );
  }

  if (gatewayState === "failure") {
    return (
      <div className="mx-auto max-w-md p-4">
        <div className="card mt-10 text-center py-10">
          <XCircle className="mx-auto mb-3 text-red-500" size={48} />
          <h1 className="text-xl font-bold text-gray-900">Pagamento não aprovado</h1>
          <p className="mt-1 text-sm text-gray-500">
            Não foi possível confirmar o pagamento via {PAYMENT_LABELS[lastOrder.paymentMethod]}. Tente novamente.
          </p>
          <Button className="mt-6" onClick={handleRetry}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md p-4">
      <div className="card mt-10 text-center py-10">
        <CheckCircle2 className="mx-auto mb-3 text-green-500" size={48} />
        <h1 className="text-xl font-bold text-gray-900">Pagamento aprovado!</h1>
        <p className="mt-1 text-sm text-gray-500">
          Pedido #{lastOrder.id} confirmado — total de {formatCurrency(lastOrder.total)}.
        </p>
        <Button className="mt-6" onClick={() => navigate(`/pedido/${lastOrder.id}`)}>
          Acompanhar meu pedido
        </Button>
      </div>
    </div>
  );
}
