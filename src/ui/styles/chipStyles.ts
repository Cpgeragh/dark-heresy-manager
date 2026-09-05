export type ChipSize = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<ChipSize, string> = {
  lg: "h-8 lg:h-9 text-sm lg:text-base px-3 lg:px-4",
  md: "h-6 text-xs lg:text-sm px-1.5 lg:px-2",
  sm: "h-5 text-[10px] lg:text-xs px-1 lg:px-1.5",
};

const BASE_CLASS =
  "inline-flex items-center justify-center gap-1 rounded border pt-px font-medium leading-none whitespace-nowrap";

export interface ChipStyleOptions {
  size?: ChipSize;
  className?: string;
}

export function chipClassName({ size = "md", className }: ChipStyleOptions = {}) {
  return [BASE_CLASS, SIZE_CLASSES[size], className].filter(Boolean).join(" ");
}
