import {
  colourBorderRed,
  colourBorderSurface,
  colourFillPanel,
  colourTextPrimary,
} from "./colourTokens";
import { uiDisabledLook, uiFocusRing } from "./buttonStyles";
import { uiCorner } from "./shapeStyles";

export type FieldResize = "none" | "vertical";
export type FieldSize = "default" | "large";

interface FieldControlOptions {
  editable: boolean;
  invalid?: boolean;
  resize?: FieldResize;
  size?: FieldSize;
}

type FieldColourOptions = Pick<FieldControlOptions, "editable" | "invalid">;

const fieldControlBase = "w-full border px-2 py-1 text-sm lg:text-base";

/** Larger border and padding with no fixed width, so the box can fill a row beside a button. */
const fieldControlLarge = "border px-3 lg:px-4 py-2 lg:py-2.5 text-sm lg:text-base";

const fieldColourBase = `${uiCorner} transition placeholder:text-slate-500`;

const fieldControlEditable = `${colourFillPanel} ${colourBorderSurface} ${colourTextPrimary} ${uiFocusRing}`;

const fieldControlInvalid = `${colourFillPanel} ${colourBorderRed} ${colourTextPrimary} ${uiFocusRing}`;

const fieldControlReadOnly = `${colourFillPanel} ${colourBorderSurface} ${colourTextPrimary} ${uiDisabledLook}`;

/** Corners, fill, border and selected border for a text box, with no size classes. */
export function fieldColourClass({ editable, invalid = false }: FieldColourOptions) {
  const stateClass = !editable
    ? fieldControlReadOnly
    : invalid
      ? fieldControlInvalid
      : fieldControlEditable;

  return `${fieldColourBase} ${stateClass}`;
}

export function fieldControlClass({
  editable,
  invalid = false,
  resize,
  size = "default",
}: FieldControlOptions) {
  const resizeClass = resize === "vertical" ? "resize-y" : resize === "none" ? "resize-none" : "";
  const sizeClass = size === "large" ? fieldControlLarge : fieldControlBase;

  return [sizeClass, fieldColourClass({ editable, invalid }), resizeClass].join(" ");
}
