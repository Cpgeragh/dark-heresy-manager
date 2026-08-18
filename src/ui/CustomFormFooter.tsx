import { Button } from "./Button";

/** Shared footer key for forms that mark mandatory controls with a red asterisk. */
export function RequiredFieldsNote() {
  return (
    <p className="text-xs lg:text-sm text-slate-300">
      <span className="text-red-500" aria-hidden="true">*</span> Required
    </p>
  );
}

interface CustomFormFooterProps {
  canSubmit: boolean;
  submitLabel: string;
  onSubmit: () => void | Promise<void>;
  onCancel: () => void;
  saving?: boolean;
  savingLabel?: string;
  className?: string;
}

/** Shared validation note and actions for custom-item forms. */
export function CustomFormFooter({
  canSubmit,
  submitLabel,
  onSubmit,
  onCancel,
  saving = false,
  savingLabel = "Saving...",
  className = "",
}: CustomFormFooterProps) {
  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <RequiredFieldsNote />
      <div className="flex gap-2">
        <Button className="flex-1" onClick={onSubmit} disabled={!canSubmit || saving}>
          {saving ? savingLabel : submitLabel}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
