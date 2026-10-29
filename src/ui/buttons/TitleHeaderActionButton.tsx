import type { ButtonHTMLAttributes } from "react";
import { colourHoverTextPrimary, colourTextMuted } from "../styles/colourTokens";
import { uiDisabledControl, uiFocusRing, uiPressFeedback } from "../styles/buttonStyles";
import { uiCorner } from "../styles/shapeStyles";

type TitleHeaderActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

/** Shared borderless action used in centred picker and form headers. */
export function TitleHeaderActionButton({
  className = "",
  type = "button",
  disabled,
  ...props
}: TitleHeaderActionButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center ${uiCorner} text-lg ${colourTextMuted} ${
        disabled ? "" : colourHoverTextPrimary
      } transition ${uiPressFeedback(!disabled)} ${uiFocusRing} ${uiDisabledControl} lg:text-xl ${className}`.trim()}
      {...props}
    />
  );
}
