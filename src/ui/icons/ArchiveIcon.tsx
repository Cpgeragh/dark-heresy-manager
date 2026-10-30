import type { IconProps } from "./iconTypes";
import { uiIconSize } from "../styles/iconStyles";

export function ArchiveIcon({ className = uiIconSize.inline }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect x="3" y="3" width="18" height="5" rx="1" />
      <path d="M5 8v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" />
      <path d="M10 12h4" />
    </svg>
  );
}
