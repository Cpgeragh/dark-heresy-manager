// src/pages/CharacterSheet/QuirkPicker.tsx

import { useState } from "react";
import { QUIRK_OPTIONS } from "../../data/reference/appearanceData";
import { uiItemName } from "../../ui/styles/editableStyles";
import { PickerModal, PickerRow } from "../../ui/pickers/PickerModal";

export function QuirkPicker({
  existing,
  onSelect,
  onClose,
}: {
  existing: string[];
  onSelect: (quirk: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const options = QUIRK_OPTIONS.filter(
    (quirk) => !existing.includes(quirk) && quirk.toLowerCase().includes(normalizedQuery)
  ).sort((a, b) => a.localeCompare(b));

  return (
    <PickerModal
      title="Add Quirk"
      placeholder="Search quirks…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={options.length === 0}
    >
      {options.map((quirk) => (
        <PickerRow key={quirk} onClick={() => onSelect(quirk)}>
          <span className={`${uiItemName} group-hover:text-white`}>{quirk}</span>
        </PickerRow>
      ))}
    </PickerModal>
  );
}
