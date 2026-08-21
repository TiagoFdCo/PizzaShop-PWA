import { describe, it, expect, vi, beforeEach } from "vitest";
import { createProduct, deleteProduct } from "../../src/services/productService";
import * as api from "../../src/services/api";

describe("productService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("cria uma pizza com POST", async () => {
    const spy = vi.spyOn(api, "apiFetch").mockResolvedValue({ id: "1" } as any);

    await createProduct({ name: "Marguerita" } as any);

    expect(spy).toHaveBeenCalledWith("/products", expect.objectContaining({ method: "POST" }));
  });

  it("remove uma pizza com DELETE", async () => {
    const spy = vi.spyOn(api, "apiFetch").mockResolvedValue(undefined as any);

    await deleteProduct("1");

    expect(spy).toHaveBeenCalledWith("/products/1", expect.objectContaining({ method: "DELETE" }));
  });
});
