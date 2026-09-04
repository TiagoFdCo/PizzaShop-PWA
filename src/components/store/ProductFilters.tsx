interface ProductFiltersProps {
  categories: string[];
  selected: string | null;
  onChange: (category: string | null) => void;
}

export function ProductFilters({ categories, selected, onChange }: ProductFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2 rounded-2xl border border-[#eadfd4] bg-white/70 p-2 shadow-sm">
      <button
        onClick={() => onChange(null)}
        className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
          !selected
            ? "border-[#2a1a15] bg-[#2a1a15] text-white shadow-md"
            : "border-[#eadfd4] bg-white text-[#6f625c] hover:border-[#cdb7a7] hover:text-[#2a1a15]"
        }`}
      >
        Todas
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`rounded-full border px-4 py-2 text-sm font-semibold capitalize transition-all ${
            selected === cat
              ? "border-[#b52f27] bg-[#b52f27] text-white shadow-md"
              : "border-[#eadfd4] bg-white text-[#6f625c] hover:border-[#efc7bf] hover:text-[#a92822]"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
