import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { RootLayout } from "./components/layout/RootLayout";
import { StoreLayout } from "./components/layout/StoreLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Spinner } from "./components/ui/Spinner";

// Loja
const LandingPage = lazy(() => import("./pages/store/LandingPage").then((m) => ({ default: m.LandingPage })));
const MenuPage = lazy(() => import("./pages/store/MenuPage").then((m) => ({ default: m.MenuPage })));
const ProductDetailPage = lazy(() =>
  import("./pages/store/ProductDetailPage").then((m) => ({ default: m.ProductDetailPage }))
);
const CartPage = lazy(() => import("./pages/store/CartPage").then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import("./pages/store/CheckoutPage").then((m) => ({ default: m.CheckoutPage })));
const PaymentPage = lazy(() => import("./pages/store/PaymentPage").then((m) => ({ default: m.PaymentPage })));
const OrderTrackingPage = lazy(() =>
  import("./pages/store/OrderTrackingPage").then((m) => ({ default: m.OrderTrackingPage }))
);

// Admin
const AdminLoginPage = lazy(() => import("./pages/admin/LoginPage").then((m) => ({ default: m.LoginPage })));
const AdminDashboardPage = lazy(() =>
  import("./pages/admin/DashboardPage").then((m) => ({ default: m.DashboardPage }))
);
const AdminCustomizationPage = lazy(() =>
  import("./pages/admin/CustomizationPage").then((m) => ({ default: m.CustomizationPage }))
);
const AdminMenuManagementPage = lazy(() =>
  import("./pages/admin/MenuManagementPage").then((m) => ({ default: m.MenuManagementPage }))
);
const AdminOrdersManagementPage = lazy(() =>
  import("./pages/admin/OrdersManagementPage").then((m) => ({ default: m.OrdersManagementPage }))
);

function Fallback() {
  return <Spinner label="Carregando..." />;
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />, // carrega o tenantConfig e injeta o tema antes de tudo
    children: [
      // Loja (modo cliente)
      {
        element: <StoreLayout />,
        children: [
          { path: "/", element: <LandingPage /> },
          { path: "/cardapio", element: <MenuPage /> },
          { path: "/produto/:id", element: <ProductDetailPage /> },
          { path: "/carrinho", element: <CartPage /> },
          { path: "/checkout", element: <CheckoutPage /> },
          { path: "/pagamento", element: <PaymentPage /> },
          { path: "/pedido/:id", element: <OrderTrackingPage /> },
        ],
      },
      // Admin (modo administrativo)
      {
        path: "/admin",
        children: [
          { index: true, element: <AdminLoginPage /> },
          {
            element: <ProtectedRoute />,
            children: [
              {
                element: <AdminLayout />,
                children: [
                  { path: "dashboard", element: <AdminDashboardPage /> },
                  { path: "customizacao", element: <AdminCustomizationPage /> },
                  { path: "cardapio", element: <AdminMenuManagementPage /> },
                  { path: "pedidos", element: <AdminOrdersManagementPage /> },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]);

export function AppRouter() {
  return (
    <Suspense fallback={<Fallback />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
