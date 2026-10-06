import { useEffect, useState } from "react";
import { PENDING_OVERLAY_DELAY_MS } from "../constants/ui";
import { LoadingDots } from "./LoadingDots";
import { colourOverlayBackdrop, colourTextPrimary } from "./styles/colourTokens";

export function PendingOverlay({ active }: { active: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      return;
    }
    const timer = window.setTimeout(() => setVisible(true), PENDING_OVERLAY_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [active]);

  if (!active || !visible) return null;

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`absolute inset-0 z-10 flex items-start justify-center rounded-lg pt-16 text-4xl font-bold ${colourOverlayBackdrop} ${colourTextPrimary}`}
    >
      <LoadingDots />
    </div>
  );
}
