import { useEffect } from "react";
import { useRouteError } from "react-router-dom";

const RELOAD_FLAG = "pizzashop:chunk-reload-attempted";

function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    /Failed to fetch dynamically imported module/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message)
  );
}

/**
 * errorElement da rota raiz. Depois de um novo build (deploy), uma aba já
 * aberta pode tentar buscar um chunk JS com o hash antigo, que não existe
 * mais no servidor — "Failed to fetch dynamically imported module". Em vez
 * de mostrar a tela padrão de erro do React Router, recarrega a página
 * automaticamente (uma vez só, controlado por sessionStorage pra não entrar
 * em loop) — resolve sozinho na maioria dos casos.
 */
export function RouteErrorBoundary() {
  const error = useRouteError();
  const isChunkError = isChunkLoadError(error);

  useEffect(() => {
    if (isChunkError && !sessionStorage.getItem(RELOAD_FLAG)) {
      sessionStorage.setItem(RELOAD_FLAG, "1");
      window.location.reload();
    }
  }, [isChunkError]);

  if (isChunkError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-gray-50 px-4 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-gray-500">Atualizando o app...</p>
      </div>
    );
  }

  const message = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4 text-center">
      <p className="text-lg font-semibold text-gray-900">Algo deu errado</p>
      <p className="max-w-sm text-sm text-gray-500">{message}</p>
      <button
        onClick={() => window.location.assign("/")}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
      >
        Voltar ao início
      </button>
    </div>
  );
}
