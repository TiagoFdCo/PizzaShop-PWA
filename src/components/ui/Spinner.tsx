interface SpinnerProps {
  label?: string;
  className?: string;
}

export function Spinner({ label, className = "" }: SpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-10 ${className}`} role="status">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      {label && <span className="text-sm text-gray-500">{label}</span>}
    </div>
  );
}
