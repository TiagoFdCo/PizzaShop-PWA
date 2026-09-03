import { Bike, LogOut } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";

interface DriverLayoutProps {
  children: React.ReactNode;
}

export function DriverLayout({ children }: DriverLayoutProps) {
  const session = useAuthStore((s) => s.session);
  const clearSession = useAuthStore((s) => s.clearSession);

  // session.name vem do ExtendedSession (campo adicionado ao store)
  const driverName = session?.name ?? session?.username ?? "Entregador";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-orange-500 rounded-lg p-1.5">
            <Bike size={18} className="text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-medium">
              Entregador
            </p>
            <p className="text-sm font-semibold text-zinc-100 leading-none">
              {driverName}
            </p>
          </div>
        </div>

        <button
          onClick={clearSession}
          className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors text-sm py-1 px-2 rounded-md hover:bg-zinc-800"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
