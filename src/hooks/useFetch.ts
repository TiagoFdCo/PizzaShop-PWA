import { useState, useEffect, useCallback } from "react";

interface UseFetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useFetch<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<UseFetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const run = useCallback(() => {
    let cancelled = false;

    setState({ data: null, loading: true, error: null });

    fetcher()
      .then((data) => {
        if (!cancelled) {
          setState({ data, loading: false, error: null });
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : "An unexpected error occurred";
          setState({ data: null, loading: false, error: message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fetcher]);

  const depsKey = JSON.stringify(deps);

  // Starting the request from an effect is intentional: this hook synchronizes
  // component state with an external asynchronous data source.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => run(), [run, depsKey]);

  return state;
}
