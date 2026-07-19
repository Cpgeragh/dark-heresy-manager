// src/ui/OptionPickerScreen.tsx

import { PickerModal } from "./PickerModal";
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
      closeLabel="←"
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
          <button
            key={value}
            type="button"
            onClick={() => onSelect(value)}
            className={`w-full text-left px-4 lg:px-5 py-3 lg:py-4 transition group ${
              value === selected ? "bg-slate-800" : "hover:bg-slate-800"
            }`}
          >
            <span className={`${uiItemName} group-hover:text-white`}>{label}</span>
          </button>
        );
      })}
    </PickerModal>
  );
}
