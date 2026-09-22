import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { useOrderStore } from "../../store/useOrderStore";
import { useCartStore } from "../../store/useCartStore";
import { formatCurrency } from "../../lib/formatCurrency";
import { getPayment, startPayment } from "../../services/paymentService";
import { Spinner } from "../../components/ui/Spinner";
import { Button } from "../../components/ui/Button";

type GatewayState = "redirecting" | "confirming" | "success" | "failure" | "timeout";

const PAYMENT_LABELS: Record<string, string> = { pix: "Pix", cartao: "Cartão", dinheiro: "Dinheiro na entrega" };

// Quantas vezes checar o resultado depois de voltar do Mercado Pago, antes
// de desistir e mostrar "ainda confirmando" (30s no total).
const MAX_POLL_ATTEMPTS = 15;
const POLL_INTERVAL_MS = 2000;

export function PaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { lastOrder } = useOrderStore();
  const clearCart = useCartStore((state) => state.clearCart);
  const [gatewayState, setGatewayState] = useState<GatewayState>("redirecting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pollAttempt, setPollAttempt] = useState(0);

  // O Mercado Pago acrescenta esses parâmetros na URL de volta (back_urls) —
  // presença deles = estamos voltando do Checkout Pro, não chegando do
  // checkout pela primeira vez.
  const isReturningFromGateway =
    searchParams.has("status") || searchParams.has("payment_id") || searchParams.has("collection_id");

  useEffect(() => {
    if (!lastOrder) {
      navigate("/carrinho", { replace: true });
      return;
    }

    let cancelled = false;
    setErrorMessage(null);

    if (isReturningFromGateway) {
      // Nunca confiamos nos parâmetros da URL de retorno pra decidir o
      // resultado (eles podem ser adulterados) — só usamos a presença deles
      // como sinal de "acabou de voltar do gateway". O status de verdade
      // vem do webhook, que já deve ter atualizado o Payment a essa altura;
      // por isso consultamos (poll) em vez de confiar no redirect.
      setGatewayState("confirming");

      let tries = 0;
      const poll = () => {
        if (cancelled) return;
        getPayment(lastOrder.id)
          .then((payment) => {
            if (cancelled) return;
            if (payment.status === "aprovado") {
              clearCart();
              setGatewayState("success");
              return;
            }
            if (payment.status === "recusado") {
              setGatewayState("failure");
              return;
            }
            tries += 1;
            if (tries >= MAX_POLL_ATTEMPTS) {
              setGatewayState("timeout");
              return;
            }
            setTimeout(poll, POLL_INTERVAL_MS);
          })
          .catch((e: Error) => {
            if (cancelled) return;
            setErrorMessage(e.message);
            setGatewayState("failure");
          });
      };
      poll();
    } else {
      setGatewayState("redirecting");
      startPayment(lastOrder.id)
        .then((payment) => {
          if (cancelled) return;
          if (payment.initPoint) {
            window.location.href = payment.initPoint; // sai do SPA — vai pro Checkout Pro
            return;
          }
          // Sem initPoint: "dinheiro" (aprovado na hora) ou retry de um
          // pagamento que já estava aprovado.
          if (payment.status === "aprovado") {
            clearCart();
            setGatewayState("success");
          } else {
            setGatewayState("failure");
          }
        })
        .catch((e: Error) => {
          if (cancelled) return;
          setErrorMessage(e.message);
          setGatewayState("failure");
        });
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastOrder, navigate, clearCart, isReturningFromGateway, pollAttempt]);

  function handleRetry() {
    if (isReturningFromGateway) {
      // Limpa a query string do retorno do Mercado Pago pra iniciar um
      // pagamento novo do zero (nova preferência).
      navigate("/pagamento", { replace: true });
    } else {
      setPollAttempt((a) => a + 1);
    }
  }

  function handleCheckAgain() {
    setPollAttempt((a) => a + 1);
  }

  if (!lastOrder) return null;

  if (gatewayState === "redirecting") {
    return (
      <div className="mx-auto max-w-md p-4">
        <div className="card mt-10 text-center">
          <Spinner label={`Preparando pagamento via ${PAYMENT_LABELS[lastOrder.paymentMethod]}...`} />
          <p className="text-sm text-gray-500">Não feche esta página.</p>
        </div>
      </div>
    );
  }

  if (gatewayState === "confirming") {
    return (
      <div className="mx-auto max-w-md p-4">
        <div className="card mt-10 text-center">
          <Spinner label="Confirmando seu pagamento..." />
          <p className="text-sm text-gray-500">Isso leva só alguns segundos.</p>
        </div>
      </div>
    );
  }

  if (gatewayState === "timeout") {
    return (
      <div className="mx-auto max-w-md p-4">
        <div className="card mt-10 text-center py-10">
          <Clock className="mx-auto mb-3 text-amber-500" size={48} />
          <h1 className="text-xl font-bold text-gray-900">Ainda confirmando...</h1>
          <p className="mt-1 text-sm text-gray-500">
            Seu pagamento pode levar mais alguns instantes para ser confirmado pelo Mercado Pago.
          </p>
          <Button className="mt-6" onClick={handleCheckAgain}>
            Verificar novamente
          </Button>
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
            {errorMessage ??
              `Não foi possível confirmar o pagamento via ${PAYMENT_LABELS[lastOrder.paymentMethod]}. Tente novamente.`}
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
