import { useNavigate } from "react-router-dom";

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center text-center px-4 py-16">
      <h1 className="text-4xl font-extrabold text-[var(--color-primary)] mb-3">
        Pizza quentinha, do jeito que você quer
      </h1>
      <p className="text-gray-600 max-w-md mb-6">
        Monte sua pizza com os ingredientes que você gosta e acompanhe o pedido em tempo real.
      </p>
      <button
        onClick={() => navigate("/cardapio")}
        className="px-6 py-3 rounded-full bg-[var(--color-primary,black)] text-white font-semibold hover:opacity-90 transition-opacity"
      >
        Ver cardápio
      </button>
    </div>
  );
}