import { Link, NavLink, Outlet } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useTenantStore } from "../../store/useTenantStore";
import { useCartStore } from "../../store/useCartStore";

export function StoreLayout() {
  const tenant = useTenantStore((state) => state.tenant);
  const itemCount = useCartStore((state) => state.items.reduce((n, i) => n + i.quantity, 0));

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            {tenant?.logoUrl && (
              <img src={tenant.logoUrl} alt={tenant.name} className="h-9 w-9 rounded-full object-cover" />
            )}
            <span className="font-display text-lg font-bold text-gray-900">
              {tenant?.name ?? "PizzaShop"}
            </span>
          </Link>

          <nav className="flex items-center gap-4 text-sm font-medium text-gray-600">
            <NavLink to="/cardapio" className={({ isActive }) => (isActive ? "text-primary" : "hover:text-primary")}>
              Cardápio
            </NavLink>
            <Link to="/carrinho" className="relative flex items-center gap-1 hover:text-primary" aria-label="Carrinho">
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-gray-100 bg-white px-4 py-6 text-sm text-gray-500">
        <div className="mx-auto max-w-5xl space-y-1">
          <p className="font-semibold text-gray-700">{tenant?.name}</p>
          {tenant?.address && <p>{tenant.address}</p>}
          {tenant?.openingHours && <p>Funcionamento: {tenant.openingHours}</p>}
          <p className="pt-2 text-xs text-gray-400">
            <Link to="/admin" className="hover:text-primary">
              Acesso administrativo
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
