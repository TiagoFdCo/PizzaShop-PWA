import { Suspense } from "react";
import { RouterProvider } from "react-router-dom";
import { Spinner } from "./components/ui/Spinner";
import { router } from "./routerConfig";

function Fallback() {
  return <Spinner label="Carregando..." />;
}

export function AppRouter() {
  return (
    <Suspense fallback={<Fallback />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
