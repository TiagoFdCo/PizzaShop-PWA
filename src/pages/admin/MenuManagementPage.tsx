import { useState } from "react";
import { Plus } from "lucide-react";
import { useFetch } from "../../hooks/useFetch";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../../services/productService";
import { ProductForm } from "../../components/admin/ProductForm";
import { ProductTable } from "../../components/admin/ProductTable";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Spinner";
import type { Pizza } from "../../types/product";
import type { ProductFormData } from "../../lib/validators";

export function MenuManagementPage() {
  const { data: products, loading, error, refetch } = useRefetchableProducts();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Pizza | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(product: Pizza) {
    setEditing(product);
    setModalOpen(true);
  }

  async function handleSubmit(data: ProductFormData) {
    const payload = { ...data, availableToppings: editing?.availableToppings ?? [] };
    if (editing) {
      await updateProduct(editing.id, payload);
    } else {
      await createProduct(payload);
    }
    setModalOpen(false);
    refetch();
  }

  async function handleDelete(product: Pizza) {
    if (!confirm(`Excluir "${product.name}" do cardápio?`)) return;
    await deleteProduct(product.id);
    refetch();
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestão de Cardápio</h1>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-1" /> Nova pizza
        </Button>
      </div>

      {loading && <Spinner label="Carregando cardápio..." />}
      {error && <p className="text-red-600 text-sm">Não foi possível carregar o cardápio. {error}</p>}
      {!loading && !error && (
        <ProductTable products={products ?? []} onEdit={openEdit} onDelete={handleDelete} />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar pizza" : "Nova pizza"}>
        <ProductForm initialData={editing} onSubmit={handleSubmit} onCancel={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}

// useFetch não expõe refetch por padrão nesta versão do hook — encapsulamos aqui
// para reaproveitar loading/error/data sem duplicar lógica de fetch manual.
function useRefetchableProducts() {
  const [key, setKey] = useState(0);
  const { data, loading, error } = useFetch(getProducts, [key]);
  return { data, loading, error, refetch: () => setKey((k) => k + 1) };
}
