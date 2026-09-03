import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrderStatusTracker } from "../../src/components/store/OrderStatusTracker";
import { ORDER_STATUS_LABELS } from "../../src/types/order";

describe("OrderStatusTracker", () => {
  it("renderiza os 5 passos do fluxo do pedido", () => {
    render(<OrderStatusTracker status="recebido" />);
    expect(screen.getByText(ORDER_STATUS_LABELS.recebido)).toBeInTheDocument();
    expect(screen.getByText(ORDER_STATUS_LABELS.preparo)).toBeInTheDocument();
    expect(screen.getByText(ORDER_STATUS_LABELS.pronto_entrega)).toBeInTheDocument();
    expect(screen.getByText(ORDER_STATUS_LABELS.saiu_para_entrega)).toBeInTheDocument();
    expect(screen.getByText(ORDER_STATUS_LABELS.entregue)).toBeInTheDocument();
    expect(screen.queryByText(ORDER_STATUS_LABELS.falha_entrega)).not.toBeInTheDocument();
  });

  it("marca como concluídos apenas os passos até o status atual", () => {
    render(<OrderStatusTracker status="preparo" />);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.queryByText("1")).not.toBeInTheDocument();
    expect(screen.queryByText("2")).not.toBeInTheDocument();
  });

  it("no status final, todos os passos aparecem concluídos (sem números restantes)", () => {
    render(<OrderStatusTracker status="entregue" />);
    expect(screen.queryByText("1")).not.toBeInTheDocument();
    expect(screen.queryByText("2")).not.toBeInTheDocument();
    expect(screen.queryByText("3")).not.toBeInTheDocument();
    expect(screen.queryByText("4")).not.toBeInTheDocument();
  });
});