import { formatCurrency } from "../../lib/formatCurrency";
import type { ProductRecommendation } from "../../services/recommendationService";

interface RecommendationCardProps {
  product: ProductRecommendation;
  onSelect: (id: string) => void;
}

export function RecommendationCard({
  product,
  onSelect,
}: RecommendationCardProps) {
  return (
    <button
      onClick={() => onSelect(product.id)}
      className="flex-shrink-0 w-40 text-left"
    >
      <img
        src={product.imageUrl}
        alt={product.name}
        className="w-40 h-28 object-cover rounded-xl"
        loading="lazy"
      />

      <div className="mt-2">
        <h3 className="text-sm font-semibold text-gray-800 truncate">
          {product.name}
        </h3>

        <p className="text-sm font-bold text-gray-900">
          {formatCurrency(product.basePrice)}
        </p>
      </div>
    </button>
  );
}