import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { chipClassName, type ChipStyleOptions } from "../styles/chipStyles";
import { chipColours, type ChipColour } from "../styles/colourTokens";

type SpanChipProps = ChipStyleOptions &
  HTMLAttributes<HTMLSpanElement> & {
    as?: "span";
    colour?: ChipColour;
    children: ReactNode;
  };

type ButtonChipProps = ChipStyleOptions &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    as: "button";
    colour?: ChipColour;
    children: ReactNode;
  };

type ChipProps = SpanChipProps | ButtonChipProps;

export function Chip(props: ChipProps) {
  if (props.as === "button") {
    const { as: _as, size = "md", colour, className, children, ...buttonProps } = props;
    void _as;
    return (
      <button
        type="button"
        className={chipClassName({
          size,
          className: [colour ? chipColours[colour] : undefined, className].filter(Boolean).join(" "),
        })}
        {...buttonProps}
      >
        {children}
      </button>
    );
  }

  const { as: _as, size = "md", colour, className, children, ...spanProps } = props;
  void _as;
  return (
    <span
      className={chipClassName({
        size,
        className: [colour ? chipColours[colour] : undefined, className].filter(Boolean).join(" "),
      })}
      {...spanProps}
    >
      {children}
    </span>
  );
}
