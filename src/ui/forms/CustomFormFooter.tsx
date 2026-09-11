import { Button } from "../buttons/Button";
import { colourRequiredText } from "../styles/colourTokens";

/** Shared footer key for forms that mark mandatory controls with a red asterisk. */
export function RequiredFieldsNote() {
  return (
    <p className={`text-xs lg:text-sm ${colourRequiredText}`}>
      <span aria-hidden="true">*</span> Required
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
  formId?: string;
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
  formId,
}: CustomFormFooterProps) {
  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <RequiredFieldsNote />
      <div className="flex gap-2">
        <Button
          type={formId ? "submit" : "button"}
          form={formId}
          className="flex-1"
          onClick={formId ? undefined : onSubmit}
          disabled={!canSubmit || saving}
        >
          {saving ? savingLabel : submitLabel}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
