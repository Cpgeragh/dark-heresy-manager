// src/pages/characterSheet/AppearanceTraitPicker.tsx

import { useState } from "react";
import { Button } from "../../ui/Button";
import { ArrowLeft } from "../../ui/PickerArrows";
import { uiPickerBackButton } from "../../ui/buttonStyles";
import { editableInputClass, uiFormLabel, uiItemName } from "../../ui/editableStyles";
import { PickerBody, PickerModal, PickerRow } from "../../ui/PickerModal";

function qualifierOf(base: string, value?: string): string {
  const prefix = `${base} (`;
  if (!value || !value.startsWith(prefix) || !value.endsWith(")")) return "";
  return value.slice(prefix.length, -1);
}

export function AppearanceTraitPicker({
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  title: string;
  options: readonly string[];
  selected?: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  const [qualifying, setQualifying] = useState<string | null>(null);
  const [qualifier, setQualifier] = useState("");

  const sorted = [...options].sort((a, b) => a.localeCompare(b));

  if (qualifying) {
    const base = qualifying.replace(" (any)", "");
    return (
      <PickerModal
        title={base}
        query=""
        onQueryChange={() => undefined}
        onClose={() => setQualifying(null)}
        closeLabel={<ArrowLeft />}
        closeAriaLabel="Back"
        hideSearch
        isEmpty={false}
        footer={
          <div className="flex gap-2">
            <button type="button" onClick={() => setQualifying(null)} className={uiPickerBackButton}>
              Back
            </button>
            <Button
              size="sm"
              type="button"
              onClick={() => onSelect(qualifier.trim() ? `${base} (${qualifier.trim()})` : qualifying)}
              className="flex-1"
            >
              Use This
            </Button>
          </div>
        }
      >
        <PickerBody>
          <div>
            <label className={uiFormLabel} htmlFor="appearance-qualifier">Colour</label>
            <input
              id="appearance-qualifier"
              type="text"
              autoFocus
              value={qualifier}
              onChange={(e) => setQualifier(e.target.value)}
              placeholder="e.g. Blue"
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>
        </PickerBody>
      </PickerModal>
    );
  }

  return (
    <PickerModal
      title={title}
      query=""
      onQueryChange={() => undefined}
      onClose={onClose}
      hideSearch
      isEmpty={false}
    >
      {sorted.map((option) => {
        const isAny = option.endsWith("(any)");
        const base = option.replace(" (any)", "");
        const rowSelected = isAny
          ? selected === option || qualifierOf(base, selected) !== ""
          : selected === option;
        return (
          <PickerRow
            key={option}
            selected={rowSelected}
            onClick={() => {
              if (!isAny) {
                onSelect(option);
                return;
              }
              setQualifier(qualifierOf(base, selected));
              setQualifying(option);
            }}
          >
            <span className={`${uiItemName} group-hover:text-white`}>{option}</span>
          </PickerRow>
        );
      })}
    </PickerModal>
  );
}
