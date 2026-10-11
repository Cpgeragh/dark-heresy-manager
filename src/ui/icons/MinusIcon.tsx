import type { IconProps } from "./iconTypes";

export function MinusIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect x="3" y="8.5" width="14" height="3" rx="1" />
    </svg>
  );
}
