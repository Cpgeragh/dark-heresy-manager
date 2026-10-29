import { uiCorner } from "./shapeStyles";
export type ChipSize = "sm" | "md" | "lg" | "control";

const SIZE_CLASSES: Record<ChipSize, string> = {
  lg: "h-8 px-3 pt-px text-sm lg:h-9 lg:px-4 lg:text-base",
  md: "h-6 px-1.5 pt-px text-xs lg:px-2 lg:text-sm",
  sm: "h-5 px-1 pt-px text-[10px] lg:px-1.5 lg:text-xs",
  control: "px-2.5 py-1 text-xs lg:px-3 lg:py-1.5 lg:text-sm",
};

const BASE_CLASS = `inline-flex items-center justify-center gap-1 ${uiCorner} border font-medium leading-none whitespace-nowrap`;

export interface ChipStyleOptions {
  size?: ChipSize;
  className?: string;
}

export function chipClassName({ size = "md", className }: ChipStyleOptions = {}) {
  return [BASE_CLASS, SIZE_CLASSES[size], className].filter(Boolean).join(" ");
}
