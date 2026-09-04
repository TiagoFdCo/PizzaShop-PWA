import { useState, useEffect, useRef } from "react";

interface UseFetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook para buscar dados da API.
 *
 * IMPORTANTE: `fetcher` pode ser uma arrow function inline (ex: `() => getProductById(id)`)
 * sem causar loop infinito, porque usamos useRef para sempre ter a versão mais
 * recente do fetcher sem adicionar ele como dependência do useEffect.
 * O re-fetch só acontece quando o conteúdo de `deps` muda.
 */
export function useFetch<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher; // sempre atualizado, sem ser dependência

  const [state, setState] = useState<UseFetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const depsKey = JSON.stringify(deps);

  useEffect(() => {
    let cancelled = false;

    setState({ data: null, loading: true, error: null });

    fetcherRef
      .current()
      .then((data) => {
        if (!cancelled) {
          setState({ data, loading: false, error: null });
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          const message =
            e instanceof Error ? e.message : "An unexpected error occurred";
          setState({ data: null, loading: false, error: message });
        }
      });

    return () => {
      cancelled = true;
    };
    // depsKey controla quando re-buscar; fetcherRef.current sempre tem o fetcher certo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depsKey]);

  return state;
}
