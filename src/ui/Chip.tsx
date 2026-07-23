import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { chipClassName, type ChipStyleOptions } from "./chipStyles";

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
      <button type="button" className={chipClassName({ size, className })} {...buttonProps}>
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
