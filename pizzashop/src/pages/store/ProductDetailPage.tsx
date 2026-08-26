import { useState } from "react";
import { useParams } from "react-router-dom";
import { useFetch } from "../../hooks/useFetch";
import { getProductById } from "../../services/productService";
import type { Size } from "../../types/product";

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: product, loading, error } = useFetch(() => getProductById(id!), [id]);
  const [size, setSize] = useState<Size | null>(null);
  const [toppingIds, setToppingIds] = useState<string[]>([]);

  if (loading) return <p className="p-4">Carregando...</p>;
  if (error || !product) return <p className="p-4 text-red-600">Erro: {error}</p>;

  const toggleTopping = (toppingId: string) => {
    setToppingIds((prev) =>
      prev.includes(toppingId) ? prev.filter((t) => t !== toppingId) : [...prev, toppingId]
    );
  };

  const total =
    product.basePrice +
    toppingIds.reduce(
      (sum, tid) => sum + (product.availableToppings.find((t) => t.id === tid)?.price ?? 0),
      0
    );

  return (
    <div className="p-4">
      <img src={product.imageUrl} alt={product.name} className="w-full h-56 object-cover rounded-lg" />
      <h1 className="text-2xl font-bold mt-3">{product.name}</h1>
      <p className="text-gray-600">{product.description}</p>

      <h2 className="mt-4 font-semibold">Tamanho</h2>
      <div className="flex gap-2">
        {product.availableSizes.map((s) => (
          <button
            key={s}
            onClick={() => setSize(s)}
            className={`px-3 py-1 border rounded ${size === s ? "bg-black text-white" : ""}`}
          >
            {s}
          </button>
        ))}
      </div>

      {product.availableToppings.length > 0 && (
        <>
          <h2 className="mt-4 font-semibold">Adicionais</h2>
          {product.availableToppings.map((t) => (
            <label key={t.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={toppingIds.includes(t.id)}
                onChange={() => toggleTopping(t.id)}
              />
              {t.name} (+R$ {t.price.toFixed(2)})
            </label>
          ))}
        </>
      )}

      <p className="mt-4 text-xl font-bold">Total: R$ {total.toFixed(2)}</p>
      {/* Carrinho é responsabilidade do P3 — aqui você só monta o CartItem e chama a store dele */}
    </div>
  );
}