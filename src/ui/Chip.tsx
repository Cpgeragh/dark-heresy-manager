import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

export type ChipSize = "sm" | "md";

const SIZE_CLASSES: Record<ChipSize, string> = {
  md: "h-6 text-xs lg:text-sm px-1.5 lg:px-2",
  sm: "h-5 text-[10px] lg:text-xs px-1 lg:px-1.5",
};

const BASE_CLASS =
  "inline-flex items-center justify-center gap-1 rounded border pt-px font-medium leading-none whitespace-nowrap";

export interface ChipStyleOptions {
  size?: ChipSize;
  className?: string;
}

export function chipClassName({
  size = "md",
  className,
}: ChipStyleOptions = {}) {
  return [BASE_CLASS, SIZE_CLASSES[size], className].filter(Boolean).join(" ");
}

type SpanChipProps = ChipStyleOptions &
  HTMLAttributes<HTMLSpanElement> & {
    as?: "span";
    children: ReactNode;
  };

type ButtonChipProps = ChipStyleOptions &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    as: "button";
    children: ReactNode;
  };

type ChipProps = SpanChipProps | ButtonChipProps;

export function Chip(props: ChipProps) {
  if (props.as === "button") {
    const { as: _as, size = "md", className, children, ...buttonProps } = props;
    void _as;
    return (
      <button className={chipClassName({ size, className })} {...buttonProps}>
        {children}
      </button>
    );
  }

  const { as: _as, size = "md", className, children, ...spanProps } = props;
  void _as;
  return (
    <span className={chipClassName({ size, className })} {...spanProps}>
      {children}
    </span>
  );
}
