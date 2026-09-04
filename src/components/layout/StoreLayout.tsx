import { Link, NavLink, Outlet } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useTenantStore } from "../../store/useTenantStore";
import { useCartStore } from "../../store/useCartStore";

export function StoreLayout() {
  const tenant = useTenantStore((state) => state.tenant);
  const itemCount = useCartStore((state) => state.items.reduce((n, i) => n + i.quantity, 0));

  return (
    <div className="flex min-h-screen flex-col">
      <header className="store-header">
        <div className="store-header-inner flex items-center justify-between">
          <Link to="/" className="store-brand">
            {tenant?.logoUrl && (
              <img src={tenant.logoUrl} alt={tenant.name} className="store-brand-logo" />
            )}
            <span className="store-brand-name">
              {tenant?.name ?? "PizzaShop"}
            </span>
          </Link>

          <nav className="flex items-center gap-5 text-sm font-semibold">
            <NavLink to="/cardapio" className={({ isActive }) => `store-nav-link ${isActive ? "active text-primary" : "hover:text-primary"}`}>
              Cardápio
            </NavLink>
            <Link to="/carrinho" className="store-cart relative hover:text-primary" aria-label="Carrinho">
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

      <footer className="store-footer text-sm">
        <div className="store-footer-inner">
          <p className="store-footer-name">{tenant?.name}</p>
          {tenant?.address && <p>{tenant.address}</p>}
          {tenant?.openingHours && <p>Funcionamento: {tenant.openingHours}</p>}
          <p className="store-footer-bottom">
            <Link to="/admin" className="hover:text-primary">
              Acesso administrativo
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}