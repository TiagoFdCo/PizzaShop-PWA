import type { Pizza } from "../../types/product";

interface ProductCardProps {
  product: Pizza;
  onSelect: (id: string) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  return (
    <button
      onClick={() => onSelect(product.id)}
      className="flex flex-col text-left rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      <img src={product.imageUrl} alt={product.name} className="w-full h-40 object-cover" />
      <div className="p-3">
        <h3 className="font-semibold text-[var(--color-primary)]">{product.name}</h3>
        <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
        <span className="block mt-2 font-bold">
          R$ {product.basePrice.toFixed(2)}
        </span>
      </div>
    </button>
  );
} 