import { apiFetch } from "./api";
import type { Payment } from "../types/payment";

/**
 * Cria (ou reinicia, em retry) o pagamento no Mercado Pago. Se `initPoint`
 * vier preenchido, o front deve redirecionar o navegador pra lá
 * (`window.location.href = payment.initPoint`) — é a URL do Checkout Pro.
 * Sem `initPoint` (pagamento "dinheiro", ou já aprovado antes), não há pra
 * onde redirecionar: o `status` já reflete o resultado final.
 */
export async function startPayment(orderId: string): Promise<Payment> {
  return apiFetch<Payment>(`/orders/${orderId}/payment`, { method: "POST" });
}

/** Consulta o pagamento sem criar/reiniciar nada — usado no polling pós-retorno do Mercado Pago. */
export async function getPayment(orderId: string): Promise<Payment> {
  return apiFetch<Payment>(`/orders/${orderId}/payment`);
}
