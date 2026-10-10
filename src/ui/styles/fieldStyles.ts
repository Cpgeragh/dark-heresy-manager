export type FieldResize = "none" | "vertical";

interface FieldControlOptions {
  editable: boolean;
  invalid?: boolean;
  resize?: FieldResize;
}

type FieldColourOptions = Pick<FieldControlOptions, "editable" | "invalid">;

const fieldControlBase = "w-full rounded border px-2 py-1 text-sm lg:text-base";

const fieldColourBase = "transition placeholder:text-slate-500";

const fieldControlEditable =
  "bg-slate-900 border-slate-500 text-slate-200 focus:outline-none focus:border-red-500";

const fieldControlInvalid =
  "bg-slate-900 border-red-500 text-slate-200 focus:outline-none focus:border-red-400";

const fieldControlReadOnly = "bg-slate-900 border-slate-500 text-slate-200 cursor-not-allowed";

/** Fill, border and selected border for a text box, with no size classes. */
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
