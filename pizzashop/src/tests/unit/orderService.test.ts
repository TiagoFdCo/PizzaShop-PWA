import { describe, it, expect, vi, beforeEach } from "vitest";
import { getOrders, updateOrderStatus } from "../../src/services/orderService";
import * as api from "../../src/services/api";

describe("orderService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("busca a lista de pedidos", async () => {
    const mockOrders = [{ id: "1", status: "recebido" }];
    vi.spyOn(api, "apiFetch").mockResolvedValue(mockOrders as any);

    const result = await getOrders();

    expect(result).toEqual(mockOrders);
  });

  it("atualiza o status de um pedido via PATCH", async () => {
    const updated = { id: "1", status: "preparo" };
    const spy = vi.spyOn(api, "apiFetch").mockResolvedValue(updated as any);

    const result = await updateOrderStatus("1", "preparo");

    expect(spy).toHaveBeenCalledWith("/orders/1", expect.objectContaining({ method: "PATCH" }));
    expect(result.status).toBe("preparo");
  });
});
