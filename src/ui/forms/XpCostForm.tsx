import { useId, useRef, useState, type ReactNode } from "react";
import { ArrowLeft } from "../icons/PickerArrows";
import { editableInputClass } from "../styles/editableStyles";
import { CustomFormSection } from "./CustomFormSection";
import { CustomFormShell } from "./CustomFormShell";
import { FormLabel } from "./FormLabel";

interface XpCostFormProps {
  title: string;
  submitLabel: string;
  cost: string;
  onCostChange: (value: string) => void;
  onSubmit: () => void | Promise<unknown>;
  onClose: () => void;
  /** Shows the Back arrow, for a pop-up opened as the second step of a list. */
  showBack?: boolean;
  /** Any further condition besides the cost box not being empty. */
  canSubmit?: boolean;
  /** Extra notes above the cost box. */
  children?: ReactNode;
}

/** The one pop-up that asks for an XP cost before a purchase. */
export function XpCostForm({
  title,
  submitLabel,
  cost,
  onCostChange,
  onSubmit,
  onClose,
  showBack = false,
  canSubmit = true,
  children,
}: XpCostFormProps) {
  const scrollPositionRef = useRef(0);
  const [saving, setSaving] = useState(false);
  const costId = useId();

  const submit = async () => {
    setSaving(true);
    try {
      await onSubmit();
    } finally {
      setSaving(false);
    }
  };

  return (
    <CustomFormShell
      title={title}
      closeLabel={showBack ? <ArrowLeft /> : undefined}
      closeAriaLabel={showBack ? "Back" : undefined}
      maxWidth="max-w-sm"
      scrollPositionRef={scrollPositionRef}
      canSubmit={canSubmit && cost.trim() !== ""}
      submitLabel={submitLabel}
      onSubmit={submit}
      onClose={onClose}
      saving={saving}
      savingLabel={submitLabel}
    >
      <CustomFormSection title="Details">
        {children}
        <div>
          <FormLabel htmlFor={costId} required>
            XP Cost
          </FormLabel>
          <input
            id={costId}
            required
            type="text"
            inputMode="numeric"
            value={cost}
            onChange={(event) => onCostChange(event.target.value)}
            placeholder="0"
            className={editableInputClass(true) + " mt-0.5"}
            autoComplete="off"
          />
        </div>
      </CustomFormSection>
    </CustomFormShell>
  );
}
