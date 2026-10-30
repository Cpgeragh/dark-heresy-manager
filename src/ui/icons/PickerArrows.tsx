// src/ui/icons/PickerArrows.tsx

import { colourIconMuted } from "../styles/colourTokens";
import { uiIconSize } from "../styles/iconStyles";
import type { IconProps } from "./iconTypes";

function Arrow({ direction, className }: IconProps & { direction: "left" | "right" }) {
  return (
    <svg
      data-picker-arrow={direction}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`${className} shrink-0 ${colourIconMuted} ${direction === "left" ? "rotate-180" : ""}`}
    >
      <path d="M4 12h16m-6-6 6 6-6 6" />
    </svg>
  );
}

export function ArrowRight({ className = uiIconSize.px16 }: IconProps) {
  return <Arrow direction="right" className={className} />;
}

export function ArrowLeft({ className = uiIconSize.px16 }: IconProps) {
  return <Arrow direction="left" className={className} />;
}
