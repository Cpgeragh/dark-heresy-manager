// src/ui/usePendingClick.ts
// Wraps a click handler so a returned promise keeps the control busy until it settles.

import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { then?: unknown }).then === "function"
  );
}

export function usePendingClick<E extends Element>(
  onClick: ((event: MouseEvent<E>) => unknown) | undefined
) {
  const [pending, setPending] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const handleClick = useCallback(
    (event: MouseEvent<E>) => {
      const result: unknown = onClick?.(event);
      if (isThenable(result)) {
        setPending(true);
        const settle = () => {
          if (mounted.current) setPending(false);
        };
        result.then(settle, settle);
      }
    },
    [onClick]
  );

  return { pending, handleClick: onClick ? handleClick : undefined };
}
