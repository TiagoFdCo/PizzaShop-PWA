import type { Pizza } from "../../types/product";
import { formatCurrency } from "../../lib/formatCurrency";

interface ProductCardProps {
  product: Pizza;
  onSelect: (id: string) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  return (
    <button onClick={() => onSelect(product.id)} className="product-card-modern">
      <div className="product-image-wrap">
        <img src={product.imageUrl} alt={product.name} className="product-image" loading="lazy" />
      </div>
      <div className="product-body">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description line-clamp-2">{product.description}</p>
        <div className="product-footer">
          <div>
            <div className="product-price-label">A partir de</div>
            <span className="product-price">{formatCurrency(product.basePrice)}</span>
          </div>
          <span className="rounded-full bg-[#f8e3dc] px-3 py-1.5 text-xs font-bold text-[#a92822]">Escolher</span>
        </div>
      </div>
    </button>
  );
}
