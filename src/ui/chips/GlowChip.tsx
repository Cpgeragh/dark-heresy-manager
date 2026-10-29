import type { ButtonHTMLAttributes, CSSProperties, HTMLAttributes, ReactNode } from "react";
import {
  uiDisabledControl,
  uiFocusRing,
  uiHoverSurface,
  uiPressFeedback,
} from "../styles/buttonStyles";
import { chipClassName } from "../styles/chipStyles";
import {
  colourGlowActive,
  colourGlowInactive,
  colourGlowPulseCore,
  colourGlowPulseRgb,
} from "../styles/colourTokens";

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

/** CSS custom properties driving the `animate-psy-pulse` keyframe (see tailwind.config.cjs). */
function glowPulseVars(colour: GlowChipColour): CSSProperties {
  const rgb = colourGlowPulseRgb[colour];
  return {
    "--glow-lo": `0 0 1px rgba(${colourGlowPulseCore},1), 0 0 4px rgba(${rgb},1), 0 0 14px rgba(${rgb},0.8)`,
    "--glow-hi": `0 0 2px rgba(${colourGlowPulseCore},1), 0 0 6px rgba(${rgb},1), 0 0 22px rgba(${rgb},0.9)`,
  } as CSSProperties;
}

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
      style,
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
        style={pulsing ? { ...glowPulseVars(colour), ...style } : style}
        {...buttonProps}
      >
        {children}
      </button>
    );
  }

  const {
    as: _as,
    active,
    colour,
    pulsing = false,
    className,
    style,
    children,
    ...spanProps
  } = props;
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
      style={pulsing ? { ...glowPulseVars(colour), ...style } : style}
      {...spanProps}
    >
      {children}
    </span>
  );
}
