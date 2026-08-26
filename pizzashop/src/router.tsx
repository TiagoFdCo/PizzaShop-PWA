import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Loja
const LandingPage = lazy(() =>
  import("./pages/store/LandingPage").then((m) => ({ default: m.LandingPage }))
);
const MenuPage = lazy(() =>
  import("./pages/store/MenuPage").then((m) => ({ default: m.MenuPage }))
);
const ProductDetailPage = lazy(() =>
  import("./pages/store/ProductDetailPage").then((m) => ({ default: m.ProductDetailPage }))
);
const CartPage = lazy(() =>
  import("./pages/store/CartPage").then((m) => ({ default: m.CartPage }))
);
const CheckoutPage = lazy(() =>
  import("./pages/store/CheckoutPage").then((m) => ({ default: m.CheckoutPage }))
);
const PaymentPage = lazy(() =>
  import("./pages/store/PaymentPage").then((m) => ({ default: m.PaymentPage }))
);
const OrderTrackingPage = lazy(() =>
  import("./pages/store/OrderTrackingPage").then((m) => ({ default: m.OrderTrackingPage }))
);

const AdminLoginPage = lazy(() =>
  import("./pages/admin/LoginPage").then((m) => ({ default: m.LoginPage }))
);
const AdminDashboardPage = lazy(() =>
  import("./pages/admin/DashboardPage").then((m) => ({ default: m.DashboardPage }))
);

function Fallback() {
  return <p className="p-4">Carregando...</p>;
}

export const router = createBrowserRouter([
  // Loja
  { path: "/", element: <LandingPage /> },
  { path: "/cardapio", element: <MenuPage /> },
  { path: "/produto/:id", element: <ProductDetailPage /> },
  { path: "/carrinho", element: <CartPage /> },
  { path: "/checkout", element: <CheckoutPage /> },
  { path: "/pagamento", element: <PaymentPage /> },
  { path: "/pedido/:id", element: <OrderTrackingPage /> },

  // Admin
  { path: "/admin", element: <AdminLoginPage /> },
  { path: "/admin/dashboard", element: <AdminDashboardPage /> },
]);

export function AppRouter() {
  return (
    <Suspense fallback={<Fallback />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}