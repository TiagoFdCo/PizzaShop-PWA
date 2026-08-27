import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useFetch } from "../../hooks/useFetch";
import { getProductById } from "../../services/productService";
import { useCartStore } from "../../store/useCartStore";
import { formatCurrency } from "../../lib/formatCurrency";
import type { Size } from "../../types/product";
import { Spinner } from "../../components/ui/Spinner";
import { Button } from "../../components/ui/Button";

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, loading, error } = useFetch(() => getProductById(id!), [id]);
  const addItem = useCartStore((state) => state.addItem);

  const [size, setSize] = useState<Size | null>(null);
  const [toppingIds, setToppingIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [sizeError, setSizeError] = useState(false);

  if (loading) return <Spinner label="Carregando pizza..." />;
  if (error || !product) {
    return <p className="p-4 text-red-600">Não foi possível carregar esta pizza. {error}</p>;
  }

  const toggleTopping = (toppingId: string) => {
    setToppingIds((prev) =>
      prev.includes(toppingId) ? prev.filter((t) => t !== toppingId) : [...prev, toppingId]
    );
  };

  const selectedToppings = product.availableToppings.filter((t) => toppingIds.includes(t.id));
  const total = product.basePrice + selectedToppings.reduce((sum, t) => sum + t.price, 0);

  function handleAddToCart() {
    if (!size) {
      setSizeError(true);
      return;
    }
    const cartItemId = `${product!.id}-${size}-${[...toppingIds].sort().join(",")}-${notes}`;
    addItem({
      cartItemId,
      productId: product!.id,
      name: product!.name,
      imageUrl: product!.imageUrl,
      size,
      toppings: selectedToppings,
      unitPrice: total,
      notes: notes.trim() || undefined,
    });
    navigate("/carrinho");
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <img src={product.imageUrl} alt={product.name} className="w-full h-56 object-cover rounded-xl" />
      <h1 className="text-2xl font-bold mt-3 text-gray-900">{product.name}</h1>
      <p className="text-gray-600">{product.description}</p>

      <h2 className="mt-5 font-semibold text-gray-800">Tamanho</h2>
      <div className="flex gap-2 mt-2">
        {product.availableSizes.map((s) => (
          <button
            key={s}
            onClick={() => {
              setSize(s);
              setSizeError(false);
            }}
            className={`h-11 w-11 rounded-full border text-sm font-semibold transition ${
              size === s ? "border-primary bg-primary text-white" : "border-gray-300 text-gray-600"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      {sizeError && <p className="mt-1 text-xs text-red-500">Escolha um tamanho para continuar.</p>}

      {product.availableToppings.length > 0 && (
        <>
          <h2 className="mt-5 font-semibold text-gray-800">Adicionais</h2>
          <div className="mt-2 flex flex-col gap-2">
            {product.availableToppings.map((t) => (
              <label key={t.id} className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={toppingIds.includes(t.id)}
                  onChange={() => toggleTopping(t.id)}
                  className="h-4 w-4 accent-primary"
                />
                {t.name} (+{formatCurrency(t.price)})
              </label>
            ))}
          </div>
        </>
      )}

      <h2 className="mt-5 font-semibold text-gray-800">Observações</h2>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Ex: sem cebola, caprichar na borda..."
        className="input mt-2"
        rows={2}
      />

      <div className="mt-6 flex items-center justify-between">
        <p className="text-xl font-bold text-gray-900">{formatCurrency(total)}</p>
        <Button onClick={handleAddToCart}>Adicionar ao carrinho</Button>
      </div>
    </div>
  );
}
