import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OrdersTable } from "../../src/components/admin/OrdersTable";
import type { Order } from "../../src/types/order";

const mockOrder: Order = {
  id: "abc123",
  tenantId: "t1",
  items: [],
  customer: { name: "João", phone: "999", address: "Rua X" },
  paymentMethod: "pix",
  subtotal: 40,
  deliveryFee: 5,
  total: 45,
  status: "recebido",
  createdAt: new Date().toISOString(),
};

describe("OrdersTable", () => {
  it("exibe mensagem quando não há pedidos", () => {
    render(<OrdersTable orders={[]} onStatusChange={vi.fn()} />);
    expect(screen.getByText(/nenhum pedido/i)).toBeInTheDocument();
  });

  it("chama onStatusChange ao avançar o status", () => {
    const onStatusChange = vi.fn();
    render(<OrdersTable orders={[mockOrder]} onStatusChange={onStatusChange} />);

    fireEvent.click(screen.getByText(/marcar como/i));

    expect(onStatusChange).toHaveBeenCalledWith("abc123", "preparo");
  });
});
