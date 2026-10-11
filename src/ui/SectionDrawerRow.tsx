import type { ButtonHTMLAttributes, ReactNode } from "react";
import { colourNavigationActiveText, colourTextPrimary } from "./styles/colourTokens";
import { uiFocusRing, uiHoverSurface, uiPressFeedback } from "./styles/buttonStyles";
import { uiInlineRow } from "./styles/editableStyles";

interface SectionDrawerRowProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  trailing?: ReactNode;
}

/** One category, back or page row in the section drawer. */
export function SectionDrawerRow({
  active = false,
  children,
  className = "",
  trailing,
  type = "button",
  ...props
}: SectionDrawerRowProps) {
  return (
    <button
      type={type}
      aria-current={active ? "page" : undefined}
      className={`${uiInlineRow} w-full px-4 py-3 text-left text-sm transition ${
        active ? colourNavigationActiveText : colourTextPrimary
      } ${uiHoverSurface} ${uiPressFeedback()} ${uiFocusRing} ${className}`.trim()}
      {...props}
    >
      <span className="min-w-0 flex-1">{children}</span>
      {trailing}
    </button>
  );
}
