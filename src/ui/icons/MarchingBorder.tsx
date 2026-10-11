import type { IconProps } from "./iconTypes";

export function MarchingBorder({
  className = "absolute inset-0 h-full w-full animate-marching-dashes",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="4"
        y="4"
        width="92"
        height="92"
        rx="22"
        stroke="currentColor"
        strokeWidth="5"
        strokeDasharray="12.8 9.2"
      />
    </svg>
  );
}
