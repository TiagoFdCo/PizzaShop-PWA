import { ClipboardList, LogOut, Utensils } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { useTenantStore } from "../../store/useTenantStore";

export function GarcomLayout() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const tenant = useTenantStore((state) => state.tenant);
  const session = useAuthStore((state) => state.session);

  function handleLogout() {
    logout();
    navigate("/admin");
  }

  const waiterName =
    session?.staff.name ?? session?.staff.username ?? "Garçom";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="flex w-60 flex-col justify-between border-r border-gray-200 bg-white p-4">
        <div>
          <div className="mb-6 flex items-center gap-3 px-2">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Utensils size={22} />
            </div>

            <div>
              <p className="text-sm font-bold text-gray-900">Garçom</p>
              <p className="text-xs text-gray-400">
                {tenant?.name ?? "PizzaShop"}
              </p>
            </div>
          </div>

          <div className="mb-5 px-2">
            <p className="text-xs text-gray-400">Usuário</p>
            <p className="text-sm font-medium text-gray-700">
              {waiterName}
            </p>
          </div>

          <nav className="space-y-1">
            <NavLink
              to="/garcom/mesas"
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              <ClipboardList size={18} />
              Mesas
            </NavLink>
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100"
        >
          <LogOut size={18} />
          Sair
        </button>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}