import { Suspense, lazy } from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { RootLayout } from "./components/layout/RootLayout";
import { StoreLayout } from "./components/layout/StoreLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { KitchenLayout } from "./components/layout/KitchenLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DriverGate } from "./components/DriverGate";
import { Spinner } from "./components/ui/Spinner";

// Loja
const LandingPage = lazy(() => import("./pages/store/LandingPage").then((m) => ({ default: m.LandingPage })));
const MenuPage = lazy(() => import("./pages/store/MenuPage").then((m) => ({ default: m.MenuPage })));
const ProductDetailPage = lazy(() => import("./pages/store/ProductDetailPage").then((m) => ({ default: m.ProductDetailPage })));
const CartPage = lazy(() => import("./pages/store/CartPage").then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import("./pages/store/CheckoutPage").then((m) => ({ default: m.CheckoutPage })));
const PaymentPage = lazy(() => import("./pages/store/PaymentPage").then((m) => ({ default: m.PaymentPage })));
const OrderTrackingPage = lazy(() => import("./pages/store/OrderTrackingPage").then((m) => ({ default: m.OrderTrackingPage })));

// Admin
const AdminLoginPage = lazy(() => import("./pages/admin/LoginPage").then((m) => ({ default: m.LoginPage })));
const AdminDashboardPage = lazy(() => import("./pages/admin/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const AdminCustomizationPage = lazy(() => import("./pages/admin/CustomizationPage").then((m) => ({ default: m.CustomizationPage })));
const AdminMenuManagementPage = lazy(() => import("./pages/admin/MenuManagementPage").then((m) => ({ default: m.MenuManagementPage })));
const AdminOrdersManagementPage = lazy(() => import("./pages/admin/OrdersManagementPage").then((m) => ({ default: m.OrdersManagementPage })));
const AdminDriversManagementPage = lazy(() => import("./pages/admin/DriversManagementPage").then((m) => ({ default: m.DriversManagementPage })));

// Cozinha (P2)
const KitchenOrdersPage = lazy(() => import("./pages/kitchen/KitchenOrdersPage").then((m) => ({ default: m.KitchenOrdersPage })));

// Entregador (P3)
const DriverLoginPage = lazy(() => import("./pages/driver/DriverLoginPage").then((m) => ({ default: m.DriverLoginPage })));
const DriverOrdersPage = lazy(() => import("./pages/driver/DriverOrdersPage").then((m) => ({ default: m.DriverOrdersPage })));

function Fallback() {
  return <Spinner label="Carregando..." />;
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
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
      {
        path: "/admin",
        children: [
          { index: true, element: <AdminLoginPage /> },
          {
            element: <ProtectedRoute allowedRoles={["admin"]} />,
            children: [
              {
                element: <AdminLayout />,
                children: [
                  { path: "dashboard", element: <AdminDashboardPage /> },
                  { path: "customizacao", element: <AdminCustomizationPage /> },
                  { path: "cardapio", element: <AdminMenuManagementPage /> },
                  { path: "pedidos", element: <AdminOrdersManagementPage /> },
                  { path: "entregadores", element: <AdminDriversManagementPage /> },
                ],
              },
            ],
          },
        ],
      },
      // Cozinha — protegida por role
      {
        path: "/cozinha",
        element: <ProtectedRoute allowedRoles={["cozinha"]} redirectTo="/admin" />,
        children: [
          {
            element: <KitchenLayout />,
            children: [{ path: "pedidos", element: <KitchenOrdersPage /> }],
          },
        ],
      },
      // Entregador — mostra login se não autenticado, pedidos se autenticado
      {
        path: "/entrega",
        element: <DriverGate login={<DriverLoginPage />} app={<DriverOrdersPage />} />,
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