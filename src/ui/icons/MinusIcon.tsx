import type { IconProps } from "./iconTypes";
import { uiIconSize } from "../styles/iconStyles";

export function MinusIcon({ className = uiIconSize.inline }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M5 12h14" />
    </svg>
  );
}
