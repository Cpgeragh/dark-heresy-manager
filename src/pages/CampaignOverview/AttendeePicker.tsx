// src/pages/CampaignOverview/AttendeePicker.tsx
// Chooses session attendees the way weapon Qualities are chosen: a field that opens a list of the
// characters not yet chosen, an Add button, and a chip with a remove button for each attendee.

import { useMemo, useState } from "react";
import { Button } from "../../ui/buttons/Button";
import { RemovableChip } from "../../ui/chips/RemovableChip";
import { OptionPickerScreen } from "../../ui/pickers/OptionPickerScreen";
import { PickerField } from "../../ui/pickers/PickerField";
import { uiChipRow, uiStackField } from "../../ui/styles/editableStyles";

interface Character {
  id: string;
  characterName: string;
}

interface Props {
  characters: Character[];
  selected: string[];
  onChange: (next: string[]) => void;
}

function sortCharactersByName<T extends { characterName: string }>(characters: T[]): T[] {
  return [...characters].sort((a, b) => a.characterName.localeCompare(b.characterName));
}

export function AttendeePicker({ characters, selected, onChange }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const sorted = useMemo(() => sortCharactersByName(characters), [characters]);
  const available = sorted.filter((character) => !selected.includes(character.id));
  const chosen = sorted.filter((character) => selected.includes(character.id));
  const pending = sorted.find((character) => character.id === pendingId) ?? null;

  const addPending = () => {
    if (!pending) return;
    onChange([...selected, pending.id]);
    setPendingId(null);
  };

  return (
    <div className={uiStackField}>
      <div className="flex gap-2">
        <PickerField
          id="attendee-picker"
          ariaLabel="Attendees"
          className="w-full"
          value={pending?.characterName ?? ""}
          placeholder="Choose attendee…"
          onClick={() => setShowPicker(true)}
        />
        <Button variant="ghost" onClick={addPending} disabled={!pending}>
          Add
        </Button>
      </div>
      {chosen.length > 0 && (
        <div className={uiChipRow}>
          {chosen.map((character) => (
            <RemovableChip
              key={character.id}
              name={character.characterName}
              onRemove={() => onChange(selected.filter((id) => id !== character.id))}
            />
          ))}
        </div>
      )}
      {showPicker && (
        <OptionPickerScreen
          title="Attendees"
          options={available.map((character) => ({
            value: character.id,
            label: character.characterName,
          }))}
          selected={pendingId ?? undefined}
          onSelect={(id) => {
            setPendingId(id);
            setShowPicker(false);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
