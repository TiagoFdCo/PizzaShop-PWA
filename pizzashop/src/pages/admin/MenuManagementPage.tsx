import { useCallback, useEffect, useState } from "react";
import type { Pizza } from "../../types/product";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../../services/productService";
import { ProductTable } from "../../components/admin/ProductTable";
import { ProductForm } from "../../components/admin/ProductForm";
import { Spinner } from "../../components/ui/Spinner";
import type { ProductFormData } from "../../lib/validators";

// Tela "Gestão de cardápio": CRUD completo de pizzas.
// Mantém estado local simples (lista + formulário aberto/fechado) e delega
// toda chamada de API para productService.
export function MenuManagementPage() {
  const [products, setProducts] = useState<Pizza[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Pizza | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProducts(await getProducts());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(data: ProductFormData) {
    if (editing) {
      await updateProduct(editing.id, data);
    } else {
      await createProduct({ ...data, tenantId: "current", sizes: [], availableToppings: [] });
    }
    setShowForm(false);
    setEditing(null);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover esta pizza do cardápio?")) return;
    await deleteProduct(id);
    await load();
  }

  if (loading) return <Spinner />;
  if (error) return <p className="text-red-600">Erro ao carregar cardápio: {error}</p>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Gestão de Cardápio</h1>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="px-3 py-2 text-sm rounded bg-[var(--color-primary)] text-white"
        >
          + Nova pizza
        </button>
      </div>

      {showForm && (
        <div className="mb-6 border rounded p-4">
          <ProductForm
            defaultValues={editing ?? undefined}
            onSubmit={handleSubmit}
            submitLabel={editing ? "Atualizar" : "Cadastrar"}
          />
        </div>
      )}

      <ProductTable
        products={products}
        onEdit={(p) => {
          setEditing(p);
          setShowForm(true);
        }}
        onDelete={handleDelete}
      />
    </div>
  );
}
