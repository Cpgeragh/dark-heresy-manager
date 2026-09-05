// src/mechanics/traits/CustomTraitForm.tsx

import { useRef, useState } from "react";
import { editableInputClass, editableTextareaClass } from "../../ui/styles/editableStyles";
import { CustomFormSection } from "../../ui/forms/CustomFormSection";
import { CustomFormShell } from "../../ui/forms/CustomFormShell";
import { OriginSelector } from "../../ui/forms/OriginSelector";
import type { CustomItemOrigin } from "../../constants/customItems";
import { RequiredFormLabel } from "../../ui/forms/RequiredFormLabel";
import type { CustomTraitData } from "../../types/CustomItems";

export function CustomTraitForm({
  title = "Custom Trait",
  submitLabel = "Add",
  initialTrait,
  onAdd,
  onCancel,
  saving = false,
}: {
  title?: string;
  submitLabel?: string;
  initialTrait?: CustomTraitData;
  onAdd: (trait: CustomTraitData) => void | Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}) {
  const formScrollPositionRef = useRef(0);
  const [name, setName] = useState(initialTrait?.name ?? "");
  const [description, setDescription] = useState(initialTrait?.description ?? "");
  const [origin, setOrigin] = useState<"" | CustomItemOrigin>(
    initialTrait?.source === "Custom" || initialTrait?.source === "2nd Ed"
      ? initialTrait.source
      : ""
  );

  const canAdd = Boolean(name.trim()) && Boolean(description.trim()) && Boolean(origin);

  const addTrait = async () => {
    if (!canAdd || !origin) return;
    await onAdd({ name: name.trim(), description: description.trim(), source: origin });
  };

  return (
    <CustomFormShell
      title={title}
      scrollPositionRef={formScrollPositionRef}
      onClose={onCancel}
      canSubmit={canAdd}
      submitLabel={submitLabel}
      onSubmit={addTrait}
      saving={saving}
    >
      <CustomFormSection title="Identity">
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <RequiredFormLabel htmlFor="custom-trait-name">Name</RequiredFormLabel>
            <input
              id="custom-trait-name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Trait name..."
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>
        </div>
      </CustomFormSection>

      <CustomFormSection title="Origin">
        <OriginSelector name="custom-trait-origin" value={origin} onChange={setOrigin} />
      </CustomFormSection>

      <CustomFormSection title="Rules">
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <RequiredFormLabel htmlFor="custom-trait-rules">Rules Text</RequiredFormLabel>
            <textarea
              id="custom-trait-rules"
              required
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What this trait does..."
              rows={4}
              className={editableTextareaClass(true) + " mt-0.5"}
            />
          </div>
        </div>
      </CustomFormSection>
    </CustomFormShell>
  );
}
