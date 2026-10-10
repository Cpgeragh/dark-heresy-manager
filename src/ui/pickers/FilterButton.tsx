import type { ReactNode } from "react";
import { uiSectionShell } from "../styles/editableStyles";
import { uiFocusRing, uiHoverSurface, uiPressFeedback } from "../styles/buttonStyles";
import { colourTextPrimary } from "../styles/colourTokens";

interface FilterButtonProps {
  children: ReactNode;
  onClick: () => void;
  className?: string;
}

/** Button in a picker's filter row: centred words, the card border and fill, no arrow. */
export function FilterButton({ children, onClick, className = "" }: FilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${uiSectionShell} px-2 py-1 text-center text-xs lg:text-sm ${colourTextPrimary} ${uiHoverSurface} ${uiPressFeedback()} ${uiFocusRing} ${className}`.trim()}
    >
      {children}
    </button>
  );
}
