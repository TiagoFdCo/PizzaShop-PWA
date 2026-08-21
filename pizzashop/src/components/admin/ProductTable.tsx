import type { Pizza } from "../../types/product";
import { formatCurrency } from "../../lib/formatCurrency";

interface ProductTableProps {
  products: Pizza[];
  onEdit: (product: Pizza) => void;
  onDelete: (id: string) => void;
}

// Lista o cardápio cadastrado com ações de editar/remover.
// Não conhece a API diretamente: recebe os dados e callbacks via props.
export function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {
  if (products.length === 0) {
    return <p className="text-sm text-gray-500">Nenhuma pizza cadastrada.</p>;
  }

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="text-left border-b border-gray-200">
          <th className="py-2">Nome</th>
          <th className="py-2">Categoria</th>
          <th className="py-2">Preço</th>
          <th className="py-2">Status</th>
          <th className="py-2">Ações</th>
        </tr>
      </thead>
      <tbody>
        {products.map((product) => (
          <tr key={product.id} className="border-b border-gray-100">
            <td className="py-2">{product.name}</td>
            <td className="py-2">{product.category}</td>
            <td className="py-2">{formatCurrency(product.basePrice)}</td>
            <td className="py-2">{product.active ? "Ativa" : "Inativa"}</td>
            <td className="py-2 space-x-2">
              <button onClick={() => onEdit(product)} className="text-xs underline">
                Editar
              </button>
              <button onClick={() => onDelete(product.id)} className="text-xs text-red-600 underline">
                Remover
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
