import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Palette, Pizza, ClipboardList, LogOut } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useTenantStore } from "../../store/useTenantStore";

const NAV_ITEMS = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/customizacao", label: "Customização", icon: Palette },
  { to: "/admin/cardapio", label: "Cardápio", icon: Pizza },
  { to: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const tenant = useTenantStore((state) => state.tenant);

  function handleLogout() {
    logout();
    navigate("/admin");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="flex w-56 flex-col justify-between border-r border-gray-200 bg-white p-4">
        <div>
          <p className="mb-6 px-2 text-sm font-semibold text-gray-400">{tenant?.name ?? "Painel Admin"}</p>
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-100"
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
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

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
