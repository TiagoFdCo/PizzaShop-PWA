interface ProductFiltersProps {
  categories: string[];
  selected: string | null;
  onChange: (category: string | null) => void;
}

export function ProductFilters({ categories, selected, onChange }: ProductFiltersProps) {
  return (
    <div className="flex gap-2 flex-wrap mb-4">
      <button
        onClick={() => onChange(null)}
        className={`px-3 py-1 rounded-full border ${!selected ? "bg-black text-white" : ""}`}
      >
        Todas
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`px-3 py-1 rounded-full border ${selected === cat ? "bg-black text-white" : ""}`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}