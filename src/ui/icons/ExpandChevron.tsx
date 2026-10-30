// src/ui/icons/ExpandChevron.tsx

import { colourIconMuted } from "../styles/colourTokens";
import { uiIconSize } from "../styles/iconStyles";
import type { IconProps } from "./iconTypes";

export function ExpandChevron({
  expanded,
  className = uiIconSize.px16,
}: IconProps & { expanded: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${className} ${colourIconMuted} shrink-0 transition-transform ${expanded ? "" : "-rotate-90"}`}
      aria-hidden="true"
      focusable="false"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
