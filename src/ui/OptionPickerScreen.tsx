// src/ui/OptionPickerScreen.tsx

import { PickerModal, PickerRow } from "./PickerModal";
import { ArrowLeft } from "./PickerArrows";
import { uiItemName } from "./editableStyles";

export type PickerOption = string | { value: string; label: string };

export function OptionPickerScreen({
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  title: string;
  options: readonly PickerOption[];
  selected?: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <PickerModal
      title={title}
      closeLabel={<ArrowLeft />}
      closeAriaLabel="Back"
      query=""
      onQueryChange={() => {}}
      onClose={onClose}
      isEmpty={false}
      hideSearch
    >
      {options.map((option) => {
        const value = typeof option === "string" ? option : option.value;
        const label = typeof option === "string" ? option : option.label;
        return (
          <PickerRow
            key={value}
            onClick={() => onSelect(value)}
            selected={value === selected}
          >
            <span className={`${uiItemName} group-hover:text-white`}>{label}</span>
          </PickerRow>
        );
      })}
    </PickerModal>
  );
}
