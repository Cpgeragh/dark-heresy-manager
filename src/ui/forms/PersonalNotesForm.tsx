import { useId, useRef, useState } from "react";
import { PRODUCT_LIMITS } from "../../constants/productLimits";
import { editableTextareaClass } from "../styles/editableStyles";
import { CustomFormSection } from "./CustomFormSection";
import { CustomFormShell } from "./CustomFormShell";
import { FormLabel } from "./FormLabel";

interface PersonalNotesFormProps {
  value: string;
  /** Saves the note and resolves to false when the save fails, which keeps the pop-up open. */
  onSave: (text: string) => Promise<boolean>;
  onClose: () => void;
}

/** The pop-up where a player writes their own note on one entry of their character. */
export function PersonalNotesForm({ value, onSave, onClose }: PersonalNotesFormProps) {
  const scrollPositionRef = useRef(0);
  const [text, setText] = useState(value);
  const [saving, setSaving] = useState(false);
  const notesId = useId();

  const submit = async () => {
    setSaving(true);
    try {
      const saved = await onSave(text);
      if (saved) onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <CustomFormShell
      title="Edit Personal Notes"
      maxWidth="max-w-lg"
      scrollPositionRef={scrollPositionRef}
      canSubmit={text.trim() !== value.trim()}
      submitLabel="Save"
      onSubmit={submit}
      onClose={onClose}
      saving={saving}
      savingLabel="Save"
    >
      <CustomFormSection title="Details">
        <div>
          <FormLabel htmlFor={notesId}>Personal Notes</FormLabel>
          <textarea
            id={notesId}
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={PRODUCT_LIMITS.characterFieldCharacters}
            placeholder="Your own notes on this entry..."
            rows={6}
            className={editableTextareaClass(true) + " mt-0.5"}
            autoComplete="off"
          />
        </div>
      </CustomFormSection>
    </CustomFormShell>
  );
}
