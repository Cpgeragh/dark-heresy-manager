import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import {
  uiDisabledControl,
  uiFocusRing,
  uiHoverSurface,
  uiPressFeedback,
} from "../styles/buttonStyles";
import { chipClassName } from "../styles/chipStyles";
import { colourGlowActive, colourGlowInactive } from "../styles/colourTokens";

export type GlowChipColour = keyof typeof colourGlowActive;

interface GlowChipOptions {
  active: boolean;
  colour: GlowChipColour;
  pulsing?: boolean;
  children: ReactNode;
}

type GlowSpanProps = GlowChipOptions &
  HTMLAttributes<HTMLSpanElement> & {
    as?: "span";
  };

type GlowButtonProps = GlowChipOptions &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    as: "button";
  };

type GlowChipProps = GlowSpanProps | GlowButtonProps;

function glowChipClassName({
  active,
  colour,
  pulsing,
  interactive,
  disabled,
  className,
}: GlowChipOptions & {
  interactive: boolean;
  disabled: boolean;
  className?: string;
}) {
  return chipClassName({
    size: "control",
    className: [
      "transition",
      active ? colourGlowActive[colour] : colourGlowInactive[colour],
      pulsing ? "animate-psy-pulse" : "",
      interactive ? uiHoverSurface : "",
      uiPressFeedback(interactive),
      interactive ? uiFocusRing : "",
      disabled ? uiDisabledControl : "",
      className,
    ]
      .filter(Boolean)
      .join(" "),
  });
}

export function GlowChip(props: GlowChipProps) {
  if (props.as === "button") {
    const {
      as: _as,
      active,
      colour,
      pulsing = false,
      className,
      children,
      disabled,
      ...buttonProps
    } = props;
    void _as;
    const interactive = !disabled;

    return (
      <button
        type="button"
        disabled={disabled}
        className={glowChipClassName({
          active,
          colour,
          pulsing,
          interactive,
          disabled: Boolean(disabled),
          className,
          children,
        })}
        {...buttonProps}
      >
        {children}
      </button>
    );
  }

  const { as: _as, active, colour, pulsing = false, className, children, ...spanProps } = props;
  void _as;

  return (
    <span
      className={glowChipClassName({
        active,
        colour,
        pulsing,
        interactive: false,
        disabled: false,
        className,
        children,
      })}
      {...spanProps}
    >
      {children}
    </span>
  );
}
