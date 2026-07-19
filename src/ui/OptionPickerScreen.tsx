// src/ui/OptionPickerScreen.tsx

import { PickerModal } from "./PickerModal";
import { uiItemName } from "./editableStyles";

export function OptionPickerScreen({
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  title: string;
  options: readonly string[];
  selected?: string;
  onSelect: (option: string) => void;
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
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onSelect(option)}
          className={`w-full text-left px-4 lg:px-5 py-3 lg:py-4 transition group ${
            option === selected ? "bg-slate-800" : "hover:bg-slate-800"
          }`}
        >
          <span className={`${uiItemName} group-hover:text-white`}>{option}</span>
        </button>
      ))}
    </PickerModal>
  );
}
