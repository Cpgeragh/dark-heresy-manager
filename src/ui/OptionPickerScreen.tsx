// src/ui/OptionPickerScreen.tsx

import { PickerModal, PickerRow } from "./PickerModal";
import { ArrowLeft } from "./PickerArrows";
import { uiItemName } from "./editableStyles";
import { Chip } from "./Chip";
import { colourAmberFaint } from "./colourTokens";

export type PickerOption = string | { value: string; label: string; owned?: boolean };

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
        const owned = typeof option === "string" ? false : option.owned;
        return (
          <PickerRow
            key={value}
            onClick={() => onSelect(value)}
            selected={value === selected}
          >
            <span className="flex w-full items-center justify-between gap-3">
              <span className={`${uiItemName} group-hover:text-white`}>{label}</span>
              {owned && <Chip className={colourAmberFaint}>Owned</Chip>}
            </span>
          </PickerRow>
        );
      })}
    </PickerModal>
  );
}
