// src/pages/CharacterSheet/GenderPicker.tsx

import { useState } from "react";
import { Button } from "../../ui/buttons/Button";
import { ArrowLeft } from "../../ui/icons/PickerArrows";
import { editableInputClass, uiFormLabel } from "../../ui/styles/editableStyles";
import { PickerBody, PickerList, PickerModal, PickerRow } from "../../ui/pickers/PickerModal";
import { PickerRowName } from "../../ui/pickers/PickerRowParts";

const GENDER_OPTIONS = ["Male", "Female", "Other"] as const;

function isCustomGender(value?: string): value is string {
  return !!value && value !== "Male" && value !== "Female";
}

export function GenderPicker({
  selected,
  onSelect,
  onClose,
}: {
  selected?: string;
  onSelect: (gender: string) => void;
  onClose: () => void;
}) {
  const [naming, setNaming] = useState(false);
  const [customName, setCustomName] = useState(isCustomGender(selected) ? selected : "");

  if (naming) {
    return (
      <PickerModal
        title="Other"
        query=""
        onQueryChange={() => undefined}
        onClose={() => setNaming(false)}
        closeLabel={<ArrowLeft />}
        closeAriaLabel="Back"
        hideSearch
        isEmpty={false}
        footer={
          <div className="flex gap-2">
            <Button variant="neutral" size="sm" onClick={() => setNaming(false)}>
              Back
            </Button>
            <Button
              size="sm"
              type="button"
              onClick={() => onSelect(customName.trim() || "Other")}
              className="flex-1"
            >
              Use This
            </Button>
          </div>
        }
      >
        <PickerBody>
          <div>
            <label className={uiFormLabel} htmlFor="gender-custom-name">
              Rename
            </label>
            <input
              id="gender-custom-name"
              type="text"
              autoFocus
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Leave blank to use 'Other'"
              className={editableInputClass(true) + " mt-0.5"}
              autoComplete="off"
            />
          </div>
        </PickerBody>
      </PickerModal>
    );
  }

  return (
    <PickerModal
      title="Gender"
      query=""
      onQueryChange={() => undefined}
      onClose={onClose}
      hideSearch
      isEmpty={false}
    >
      <PickerList>
        {GENDER_OPTIONS.map((option) => {
          const rowSelected = option === "Other" ? isCustomGender(selected) : selected === option;
          return (
            <PickerRow
              key={option}
              selected={rowSelected}
              onClick={() => (option === "Other" ? setNaming(true) : onSelect(option))}
            >
              <PickerRowName name={option} />
            </PickerRow>
          );
        })}
      </PickerList>
    </PickerModal>
  );
}
