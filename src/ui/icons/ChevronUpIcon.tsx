import type { IconProps } from "./iconTypes";
import { uiIconSize } from "../styles/iconStyles";

export function ChevronUpIcon({ className = uiIconSize.inline }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d="m4.5 15.75 7.5-7.5 7.5 7.5" />
    </svg>
  );
}
