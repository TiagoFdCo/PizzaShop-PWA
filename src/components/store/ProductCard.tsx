import type { Pizza } from "../../types/product";
import { formatCurrency } from "../../lib/formatCurrency";

interface ProductCardProps {
  product: Pizza;
  onSelect: (id: string) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  return (
    <button
      onClick={() => onSelect(product.id)}
      className="flex flex-col text-left rounded-xl border border-gray-200 overflow-hidden bg-white hover:shadow-card transition-shadow focus-visible:ring-2 focus-visible:ring-primary"
    >
      <img src={product.imageUrl} alt={product.name} className="w-full h-40 object-cover" loading="lazy" />
      <div className="p-3">
        <h3 className="font-semibold text-gray-900">{product.name}</h3>
        <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
        <span className="block mt-2 font-bold text-primary">a partir de {formatCurrency(product.basePrice)}</span>
      </div>
    </button>
  );
}
