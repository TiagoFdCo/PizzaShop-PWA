import { Pencil, Trash2 } from "lucide-react";
import type { Pizza } from "../../types/product";
import { formatCurrency } from "../../lib/formatCurrency";

interface ProductTableProps {
  products: Pizza[];
  onEdit: (product: Pizza) => void;
  onDelete: (product: Pizza) => void;
}

export function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {
  if (products.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-500">Nenhuma pizza cadastrada ainda.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3">Pizza</th>
            <th className="px-4 py-3">Categoria</th>
            <th className="px-4 py-3">Preço base</th>
            <th className="px-4 py-3">Tamanhos</th>
            <th className="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {products.map((p) => (
            <tr key={p.id}>
              <td className="flex items-center gap-3 px-4 py-3">
                <img src={p.imageUrl} alt={p.name} className="h-10 w-10 rounded object-cover" />
                <span className="font-medium text-gray-800">{p.name}</span>
              </td>
              <td className="px-4 py-3 text-gray-600">{p.category}</td>
              <td className="px-4 py-3 text-gray-600">{formatCurrency(p.basePrice)}</td>
              <td className="px-4 py-3 text-gray-600">{p.availableSizes.join(", ")}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onEdit(p)}
                    aria-label={`Editar ${p.name}`}
                    className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-primary"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(p)}
                    aria-label={`Excluir ${p.name}`}
                    className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
