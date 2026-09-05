export type FieldResize = "none" | "vertical";

interface FieldControlOptions {
  editable: boolean;
  invalid?: boolean;
  resize?: FieldResize;
}

const fieldControlBase =
  "w-full rounded border px-2 py-1 text-sm lg:text-base transition placeholder:text-slate-500";

const fieldControlEditable =
  "bg-slate-900 border-slate-500 text-slate-200 focus:outline-none focus:border-red-500";

const fieldControlInvalid =
  "bg-slate-900 border-red-500 text-slate-200 focus:outline-none focus:border-red-400";

const fieldControlReadOnly = "bg-slate-900 border-slate-500 text-slate-200 cursor-not-allowed";

export function fieldControlClass({ editable, invalid = false, resize }: FieldControlOptions) {
  const stateClass = !editable
    ? fieldControlReadOnly
    : invalid
      ? fieldControlInvalid
      : fieldControlEditable;

  const resizeClass = resize === "vertical" ? "resize-y" : resize === "none" ? "resize-none" : "";

  return [fieldControlBase, stateClass, resizeClass].join(" ");
}
