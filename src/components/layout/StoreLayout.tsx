import { Link, NavLink, Outlet } from "react-router-dom";
import { ShoppingCart, User } from "lucide-react";
import { ThemeToggle } from "../ui/ThemeToggle";
import { useTenantStore } from "../../store/useTenantStore";
import { useCartStore } from "../../store/useCartStore";
import { useCustomerAuthStore } from "../../store/useCustomerAuthStore";

export function StoreLayout() {
  const tenant = useTenantStore((state) => state.tenant);
  const itemCount = useCartStore((state) => state.items.reduce((n, i) => n + i.quantity, 0));
  const customerSession = useCustomerAuthStore((state) => state.session);
  const logoutCustomer = useCustomerAuthStore((state) => state.logout);

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

          <nav className="flex items-center gap-3 text-sm font-semibold">
            <ThemeToggle compact />
            <NavLink to="/cardapio" className={({ isActive }) => `store-nav-link ${isActive ? "active text-primary" : "hover:text-primary"}`}>
              Cardápio
            </NavLink>

            {customerSession ? (
              <div className="flex items-center gap-3">
                <span className="hidden text-gray-600 sm:inline">Olá, {customerSession.customer.name.split(" ")[0]}</span>
                <button
                  type="button"
                  onClick={logoutCustomer}
                  className="text-gray-500 hover:text-primary"
                >
                  Sair
                </button>
              </div>
            ) : (
              <Link to="/conta/entrar" className="flex items-center gap-1 hover:text-primary" aria-label="Entrar">
                <User size={18} />
                <span className="hidden sm:inline">Entrar</span>
              </Link>
            )}

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
