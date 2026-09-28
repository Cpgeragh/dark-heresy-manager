// src/ui/LoadingDots.tsx
// Three dots that fill in one at a time, then empty and repeat, following a busy button label
// such as "Rotating". Every dot keeps its space so the label does not shift as they change.

import { useEffect, useState } from "react";

const DOTS = [0, 1, 2] as const;
const STEP_MS = 300;

export function LoadingDots() {
  const [filled, setFilled] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setFilled((current) => (current + 1) % (DOTS.length + 1));
    }, STEP_MS);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <span aria-hidden="true">
      {DOTS.map((dot) => (
        <span key={dot} className={dot < filled ? undefined : "invisible"}>
          .
        </span>
      ))}
    </span>
  );
}
