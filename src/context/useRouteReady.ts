import { createContext, useContext, useEffect } from "react";

export interface RouteReadyContextValue {
  active: boolean;
  timedOut: boolean;
  hold: () => () => void;
}

export const RouteReadyContext = createContext<RouteReadyContextValue>({
  active: true,
  timedOut: false,
  hold: () => () => undefined,
});

/** Keeps the page from being revealed while `loading` is true. */
export function useRouteLoading(loading: boolean) {
  const { hold } = useContext(RouteReadyContext);
  useEffect(() => {
    if (!loading) return;
    return hold();
  }, [hold, loading]);
}

/** True once the page is the visible one, false while it is built out of sight. */
export function useRouteActive() {
  return useContext(RouteReadyContext).active;
}

/** True when the page was revealed because loading took longer than the timeout. */
export function useRouteLoadTimedOut() {
  return useContext(RouteReadyContext).timedOut;
}
