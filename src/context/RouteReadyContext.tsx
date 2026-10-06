import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ROUTE_LOAD_TIMEOUT_MS } from "../constants/ui";
import { RouteReadyContext } from "./useRouteReady";

interface RouteReadyProviderProps {
  active: boolean;
  onReady?: () => void;
  children: ReactNode;
}

export function RouteReadyProvider({ active, onReady, children }: RouteReadyProviderProps) {
  const holds = useRef(0);
  const settled = useRef(false);
  const onReadyRef = useRef(onReady);
  const [, setVersion] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    onReadyRef.current = onReady;
  });

  const hold = useCallback(() => {
    holds.current += 1;
    setVersion((version) => version + 1);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      holds.current -= 1;
      setVersion((version) => version + 1);
    };
  }, []);

  useEffect(() => {
    if (settled.current || holds.current > 0) return;
    settled.current = true;
    onReadyRef.current?.();
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (settled.current) return;
      settled.current = true;
      setTimedOut(true);
      onReadyRef.current?.();
    }, ROUTE_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const value = useMemo(() => ({ active, timedOut, hold }), [active, timedOut, hold]);

  return <RouteReadyContext.Provider value={value}>{children}</RouteReadyContext.Provider>;
}
