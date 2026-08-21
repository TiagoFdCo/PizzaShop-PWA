export function Spinner() {
  return (
    <div className="flex justify-center py-10" role="status" aria-label="Carregando">
      <div className="w-6 h-6 border-2 border-gray-300 border-t-[var(--color-primary)] rounded-full animate-spin" />
    </div>
  );
}
