import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Minus,
  Plus,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { getProducts } from "../../services/productService";
import {
  addItemsToTab,
  closeTab,
  getTab,
  payTab,
} from "../../services/tabService";
import { formatCurrency } from "../../lib/formatCurrency";
import type { CartItem } from "../../types/order";
import type { Pizza, Size } from "../../types/product";
import type { Tab } from "../../types/tab";

export function TabPage() {
  const navigate = useNavigate();
  const { tabId } = useParams<{ tabId: string }>();

  const [tab, setTab] = useState<Tab | null>(null);
  const [products, setProducts] = useState<Pizza[]>([]);

  const [selectedProduct, setSelectedProduct] = useState<Pizza | null>(null);
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [closing, setClosing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadTab() {
    if (!tabId) {
      setError("Comanda não identificada.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getTab(tabId);
      setTab(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar a comanda."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadProducts() {
    try {
      setLoadingProducts(true);

      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar o cardápio."
      );
    } finally {
      setLoadingProducts(false);
    }
  }

  useEffect(() => {
    void loadTab();
    void loadProducts();
  }, [tabId]);

  const selectedToppingObjects = useMemo(() => {
    if (!selectedProduct) {
      return [];
    }

    return selectedProduct.availableToppings.filter((topping) =>
      selectedToppings.includes(topping.id)
    );
  }, [selectedProduct, selectedToppings]);

  const itemUnitPrice = useMemo(() => {
    if (!selectedProduct) {
      return 0;
    }

    return (
      selectedProduct.basePrice +
      selectedToppingObjects.reduce(
        (sum, topping) => sum + topping.price,
        0
      )
    );
  }, [selectedProduct, selectedToppingObjects]);

  const itemTotal = itemUnitPrice * quantity;

  function handleSelectProduct(product: Pizza) {
    setSelectedProduct(product);
    setSelectedSize(product.availableSizes[0] ?? null);
    setSelectedToppings([]);
    setQuantity(1);
  }

  function handleToggleTopping(toppingId: string) {
    setSelectedToppings((current) =>
      current.includes(toppingId)
        ? current.filter((id) => id !== toppingId)
        : [...current, toppingId]
    );
  }

  function handleIncreaseQuantity() {
    setQuantity((current) => current + 1);
  }

  function handleDecreaseQuantity() {
    setQuantity((current) => Math.max(1, current - 1));
  }

  async function handleLaunchItem() {
    if (!tabId || !selectedProduct || !selectedSize) {
      setError("Selecione um produto e um tamanho.");
      return;
    }

    try {
      setLaunching(true);
      setError(null);

      const cartItem: CartItem = {
        cartItemId: `${selectedProduct.id}-${selectedSize}-${[
          ...selectedToppings,
        ]
          .sort()
          .join(",")}-${Date.now()}`,
        productId: selectedProduct.id,
        name: selectedProduct.name,
        imageUrl: selectedProduct.imageUrl,
        size: selectedSize,
        toppings: selectedToppingObjects,
        unitPrice: itemUnitPrice,
        quantity,
      };

      const updatedTab = await addItemsToTab(tabId, [cartItem]);

      setTab(updatedTab);

      setSelectedProduct(null);
      setSelectedSize(null);
      setSelectedToppings([]);
      setQuantity(1);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível lançar o item na comanda."
      );
    } finally {
      setLaunching(false);
    }
  }

  async function handleCloseTab() {
    if (!tabId) {
      return;
    }

    try {
      setClosing(true);
      setError(null);

      const updatedTab = await closeTab(tabId);
      setTab(updatedTab);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível fechar a comanda."
      );
    } finally {
      setClosing(false);
    }
  }

  async function handlePayTab() {
    if (!tabId) {
      return;
    }

    try {
      setPaying(true);
      setError(null);

      await payTab(tabId);

      navigate("/garcom/mesas");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível finalizar o pagamento."
      );
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-500">Carregando comanda...</p>
      </div>
    );
  }

  if (!tab) {
    return (
      <div className="p-6">
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} />
          <span>{error ?? "Comanda não encontrada."}</span>
        </div>

        <button
          type="button"
          onClick={() => navigate("/garcom/mesas")}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft size={16} />
          Voltar para mesas
        </button>
      </div>
    );
  }

  const isOpen = tab.status === "aberta";
  const isClosed = tab.status === "fechada";

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate("/garcom/mesas")}
            className="mb-3 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={16} />
            Voltar para mesas
          </button>

          <h1 className="text-2xl font-bold text-gray-900">
            Comanda — Mesa {tab.tableNumber}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Status:{" "}
            <span className="font-medium text-gray-700">{tab.status}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadTab()}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Atualizar
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cardápio */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Lançar itens
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Escolha um produto para adicionar à comanda.
            </p>
          </div>

          {loadingProducts ? (
            <p className="py-8 text-center text-sm text-gray-500">
              Carregando cardápio...
            </p>
          ) : products.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              Nenhum produto disponível.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  disabled={!isOpen || launching}
                  onClick={() => handleSelectProduct(product)}
                  className={`overflow-hidden rounded-lg border text-left transition ${
                    selectedProduct?.id === product.id
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-gray-200 hover:border-gray-300"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-32 w-full object-cover"
                  />

                  <div className="p-3">
                    <p className="font-semibold text-gray-900">
                      {product.name}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {formatCurrency(product.basePrice)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedProduct && isOpen && (
            <div className="mt-6 border-t border-gray-200 pt-5">
              <h3 className="font-semibold text-gray-900">
                {selectedProduct.name}
              </h3>

              <div className="mt-4">
                <p className="mb-2 text-sm font-medium text-gray-700">
                  Tamanho
                </p>

                <div className="flex gap-2">
                  {selectedProduct.availableSizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`h-10 w-10 rounded-full border text-sm font-semibold ${
                        selectedSize === size
                          ? "border-primary bg-primary text-white"
                          : "border-gray-300 text-gray-600"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {selectedProduct.availableToppings.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-medium text-gray-700">
                    Adicionais
                  </p>

                  <div className="space-y-2">
                    {selectedProduct.availableToppings.map((topping) => (
                      <label
                        key={topping.id}
                        className="flex items-center gap-2 text-sm text-gray-700"
                      >
                        <input
                          type="checkbox"
                          checked={selectedToppings.includes(topping.id)}
                          onChange={() =>
                            handleToggleTopping(topping.id)
                          }
                          className="h-4 w-4 accent-primary"
                        />

                        <span>
                          {topping.name} (+{formatCurrency(topping.price)})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Quantidade</p>

                  <div className="mt-1 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleDecreaseQuantity}
                      disabled={quantity <= 1}
                      className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 disabled:opacity-40"
                    >
                      <Minus size={16} />
                    </button>

                    <span className="min-w-6 text-center font-semibold">
                      {quantity}
                    </span>

                    <button
                      type="button"
                      onClick={handleIncreaseQuantity}
                      className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-500">Total</p>

                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(itemTotal)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void handleLaunchItem()}
                disabled={!selectedSize || launching}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingBag size={18} />
                {launching ? "Lançando..." : "Lançar na comanda"}
              </button>
            </div>
          )}
        </section>

        {/* Comanda */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Itens da comanda
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Confira os itens lançados para a mesa.
            </p>
          </div>

          {tab.orders.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
              <p className="font-medium text-gray-700">
                Nenhum item lançado ainda.
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Selecione um produto ao lado para começar.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tab.orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-lg border border-gray-100 p-4"
                >
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 py-2"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.quantity}x {item.name}
                        </p>

                        <p className="text-sm text-gray-500">
                          Tamanho {item.size}
                        </p>

                        {item.toppings.length > 0 && (
                          <p className="text-xs text-gray-400">
                            {item.toppings.map((topping) => topping.name).join(
                              ", "
                            )}
                          </p>
                        )}
                      </div>

                      <p className="whitespace-nowrap font-medium text-gray-900">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 border-t border-gray-200 pt-5">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">
                Total
              </span>

              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(tab.total)}
              </span>
            </div>
          </div>

          {isOpen && (
            <button
              type="button"
              onClick={() => void handleCloseTab()}
              disabled={closing || tab.orders.length === 0}
              className="mt-5 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {closing ? "Fechando..." : "Fechar comanda"}
            </button>
          )}

          {isClosed && (
            <button
              type="button"
              onClick={() => void handlePayTab()}
              disabled={paying}
              className="mt-5 w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {paying ? "Processando pagamento..." : "Pagar comanda"}
            </button>
          )}
        </section>
      </div>
    </div>
  );
}