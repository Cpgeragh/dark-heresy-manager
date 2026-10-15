import {
  colourBorderRed,
  colourBorderSurface,
  colourFillPanel,
  colourTextPrimary,
} from "./colourTokens";
import { uiDisabledLook, uiFocusRing } from "./buttonStyles";
import { uiCorner } from "./shapeStyles";

export type FieldResize = "none" | "vertical";

interface FieldControlOptions {
  editable: boolean;
  invalid?: boolean;
  resize?: FieldResize;
}

type FieldColourOptions = Pick<FieldControlOptions, "editable" | "invalid">;

const fieldControlBase = "w-full border px-2 py-1 text-sm lg:text-base";

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

export function fieldControlClass({ editable, invalid = false, resize }: FieldControlOptions) {
  const resizeClass = resize === "vertical" ? "resize-y" : resize === "none" ? "resize-none" : "";

  return [fieldControlBase, fieldColourClass({ editable, invalid }), resizeClass].join(" ");
}
