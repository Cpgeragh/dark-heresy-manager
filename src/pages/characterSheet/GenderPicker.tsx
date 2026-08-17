// src/pages/characterSheet/GenderPicker.tsx

import { useState } from "react";
import { Button } from "../../ui/Button";
import { ArrowLeft } from "../../ui/PickerArrows";
import { uiPickerBackButton } from "../../ui/buttonStyles";
import { editableInputClass, uiFormLabel, uiItemName } from "../../ui/editableStyles";
import { PickerBody, PickerModal, PickerRow } from "../../ui/PickerModal";

const GENDER_OPTIONS = ["Male", "Female", "Other"] as const;

function isCustomGender(value?: string): boolean {
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
  const [customName, setCustomName] = useState(isCustomGender(selected) ? selected! : "");

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
            <button type="button" onClick={() => setNaming(false)} className={uiPickerBackButton}>
              Back
            </button>
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
            <label className={uiFormLabel} htmlFor="gender-custom-name">Rename</label>
            <input
              id="gender-custom-name"
              type="text"
              autoFocus
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Leave blank to use 'Other'"
              className={editableInputClass(true) + " mt-0.5"}
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
      {GENDER_OPTIONS.map((option) => {
        const rowSelected = option === "Other" ? isCustomGender(selected) : selected === option;
        return (
          <PickerRow
            key={option}
            selected={rowSelected}
            onClick={() => (option === "Other" ? setNaming(true) : onSelect(option))}
          >
            <span className={`${uiItemName} group-hover:text-white`}>{option}</span>
          </PickerRow>
        );
      })}
    </PickerModal>
  );
}
