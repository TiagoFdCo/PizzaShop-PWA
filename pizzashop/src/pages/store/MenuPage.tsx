import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFetch } from "../../hooks/useFetch";
import { useDebounce } from "../../hooks/useDebounce";
import { getProducts } from "../../services/productService";
import { ProductCard } from "../../components/store/ProductCard";
import { ProductFilters } from "../../components/store/ProductFilters";

export function MenuPage() {
  const navigate = useNavigate();
  const { data: products, loading, error } = useFetch(getProducts, []);
  const [category, setCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const categories = useMemo(
    () => Array.from(new Set(products?.map((p) => p.category) ?? [])),
    [products]
  );

  const filtered = useMemo(() => {
    return (products ?? []).filter((p) => {
      const matchesCategory = !category || p.category === category;
      const matchesSearch = p.name
        .toLowerCase()
        .includes(debouncedSearch.trim().toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, category, debouncedSearch]);

  if (loading) return <p className="p-4">Carregando cardápio...</p>;
  if (error) return <p className="p-4 text-red-600">Erro: {error}</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Cardápio</h1>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar pizza pelo nome..."
        className="w-full border rounded-lg px-3 py-2 mb-4"
      />

      <ProductFilters categories={categories} selected={category} onChange={setCategory} />

      {filtered.length === 0 ? (
        <p className="text-gray-500">Nenhuma pizza encontrada.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={(id) => navigate(`/produto/${id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}