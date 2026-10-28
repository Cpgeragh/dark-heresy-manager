import { Button } from "../buttons/Button";
import { colourRequiredText } from "../styles/colourTokens";
import { RequiredMark } from "./RequiredMark";
import { uiTwoColumnGrid, uiStackList } from "../styles/editableStyles";

/** Shared footer key for forms that mark mandatory controls with a red asterisk. */
export function RequiredFieldsNote() {
  return (
    <p className={`text-xs lg:text-sm ${colourRequiredText}`}>
      <RequiredMark /> Required
    </p>
  );
}

interface CustomFormFooterProps {
  canSubmit: boolean;
  submitLabel: string;
  onSubmit: () => unknown;
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
  savingLabel = "Saving",
  className = "",
  formId,
}: CustomFormFooterProps) {
  return (
    <div className={`${uiStackList} ${className}`.trim()}>
      <RequiredFieldsNote />
      <div className={uiTwoColumnGrid}>
        <Button
          type={formId ? "submit" : "button"}
          form={formId}
          fullWidth
          onClick={formId ? undefined : onSubmit}
          disabled={!canSubmit}
          loading={saving}
          loadingLabel={savingLabel}
        >
          {submitLabel}
        </Button>
        <Button type="button" variant="neutral" fullWidth onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
