import type { ButtonHTMLAttributes } from "react";
import { colourHoverTextPrimary, colourTextMuted } from "../styles/colourTokens";
import { uiDisabledControl, uiFocusRing, uiPressFeedback } from "../styles/buttonStyles";

interface TitleHeaderActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  align?: "start" | "end";
}

/** Shared borderless action used in centred picker and form headers. */
export function TitleHeaderActionButton({
  align = "end",
  className = "",
  type = "button",
  disabled,
  ...props
}: TitleHeaderActionButtonProps) {
  const alignment = align === "start" ? "justify-self-start" : "justify-self-end";

  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center ${alignment} rounded-lg text-lg ${colourTextMuted} ${
        disabled ? "" : colourHoverTextPrimary
      } transition ${uiPressFeedback(!disabled)} ${uiFocusRing} ${uiDisabledControl} lg:text-xl ${className}`.trim()}
      {...props}
    />
  );
}
