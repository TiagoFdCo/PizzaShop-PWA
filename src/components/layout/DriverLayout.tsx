import { Bike, LogOut } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";

interface DriverLayoutProps {
  children: React.ReactNode;
}

export function DriverLayout({ children }: DriverLayoutProps) {
  const session = useAuthStore((s) => s.session);
  const logout = useAuthStore((s) => s.logout);

  const driverName = session?.staff.name ?? session?.staff.username ?? "Entregador";

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900">
      {/* Header — mesma paleta (branco + primary) do Admin/Cozinha/Garçom */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Bike size={20} />
          </div>
          <div className="leading-tight">
            <p className="text-[11px] font-medium uppercase tracking-widest text-gray-400">
              Entregador
            </p>
            <p className="text-sm font-semibold leading-none text-gray-900">
              {driverName}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
