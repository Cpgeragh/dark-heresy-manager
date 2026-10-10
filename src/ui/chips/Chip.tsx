import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { chipClassName, type ChipStyleOptions } from "../styles/chipStyles";
import { uiChipButtonState, uiPressFeedback } from "../styles/buttonStyles";
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
    const { as: _as, size = "md", colour, className, children, disabled, ...buttonProps } = props;
    void _as;
    return (
      <button
        type="button"
        disabled={disabled}
        className={chipClassName({
          size,
          className: [
            colour ? chipColours[colour] : undefined,
            uiChipButtonState(!disabled),
            uiPressFeedback(!disabled),
            className,
          ]
            .filter(Boolean)
            .join(" "),
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
