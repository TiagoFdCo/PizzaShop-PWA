import { ChefHat, CheckCircle2, Clock3, Send, UserRound } from "lucide-react";
import { formatCurrency } from "../../lib/formatCurrency";
import type { Order } from "../../types/order";
import type { Staff } from "../../types/staff";
import { Button } from "../ui/Button";

interface KitchenOrderCardProps {
  order: Order;
  drivers: Staff[];
  busyAction: string | null;
  onClaim: (order: Order) => void;
  onReady: (order: Order) => void;
  onDispatch: (order: Order, driver: Staff) => void;
}

const STATUS_TEXT: Record<Order["status"], string> = {
  recebido: "Aguardando início",
  preparo: "Em preparo",
  pronto_entrega: "Pronto para entrega",
  saiu_para_entrega: "Saiu para entrega",
  entregue: "Entregue",
  falha_entrega: "Falha na entrega",
};

export function KitchenOrderCard({
  order,
  drivers,
  busyAction,
  onClaim,
  onReady,
  onDispatch,
}: KitchenOrderCardProps) {
  const actionBusy = busyAction !== null;
  return (
    <article className="card flex h-full flex-col gap-4" aria-label={`Pedido ${order.id}`}>
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Pedido</p>
          <h2 className="text-xl font-bold text-gray-900">#{order.id}</h2>
          <p className="mt-1 text-sm text-gray-600">{order.customer.name}</p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {STATUS_TEXT[order.status]}
        </span>
      </header>

      <div className="rounded-lg bg-gray-50 p-3 text-sm">
        {order.items.map((item) => (
          <div key={item.cartItemId} className="flex gap-2 py-1">
            <span className="font-semibold text-gray-800">{item.quantity}x</span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-800">{item.name} ({item.size})</p>
              {item.toppings.length > 0 && (
                <p className="text-xs text-gray-500">+ {item.toppings.map((t) => t.name).join(", ")}</p>
              )}
              {item.notes && <p className="text-xs text-gray-500">Obs.: {item.notes}</p>}
            </div>
            <span className="text-gray-600">{formatCurrency(item.unitPrice * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
        <p><strong>Endereço:</strong> {order.customer.address}</p>
        <p><strong>Telefone:</strong> {order.customer.phone}</p>
      </div>

      {order.cook && (
        <p className="flex items-center gap-2 text-xs text-gray-500">
          <ChefHat size={15} /> Cozinheiro: {order.cook.name}
        </p>
      )}

      {order.driver && (
        <p className="flex items-center gap-2 text-xs text-gray-500">
          <UserRound size={15} /> Entregador: {order.driver.name}
        </p>
      )}

      <div className="mt-auto border-t border-gray-100 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-semibold text-gray-800">Total</span>
          <span className="font-bold text-gray-900">{formatCurrency(order.total)}</span>
        </div>

        {order.status === "recebido" && (
          <Button disabled={actionBusy} onClick={() => onClaim(order)} className="w-full gap-2">
            <Clock3 size={17} />
            {busyAction === `claim:${order.id}` ? "Iniciando..." : "Iniciar preparo"}
          </Button>
        )}

        {order.status === "preparo" && (
          <Button disabled={actionBusy} onClick={() => onReady(order)} className="w-full gap-2">
            <CheckCircle2 size={17} />
            {busyAction === `ready:${order.id}` ? "Salvando..." : "Marcar pronto"}
          </Button>
        )}

        {order.status === "pronto_entrega" && (
          <form
            className="space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const data = new FormData(form);
              const driverId = String(data.get("driverId") ?? "");
              const driver = drivers.find((item) => item.id === driverId);
              if (driver) onDispatch(order, driver);
            }}
          >
            <label htmlFor={`driver-${order.id}`} className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <UserRound size={17} /> Entregador
            </label>
            <select
              id={`driver-${order.id}`}
              name="driverId"
              disabled={actionBusy}
              required
              className="input"
            >
              <option value="" disabled>Selecione um entregador</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>{driver.name}</option>
              ))}
            </select>
            <Button type="submit" disabled={actionBusy || drivers.length === 0} className="w-full gap-2">
              <Send size={17} />
              {busyAction === `dispatch:${order.id}` ? "Enviando..." : "Enviar para entrega"}
            </Button>
          </form>
        )}
      </div>
    </article>
  );
}
