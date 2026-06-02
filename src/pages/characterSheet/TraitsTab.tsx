// src/pages/characterSheet/TraitsTab.tsx

import { useCallback } from "react";
import type { TalentsAndTraitsBlock, TalentEntry } from "../../types/Character";
import { TRAIT_LIST } from "../../data/traitData";
import { EntrySection } from "./talentComponents";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TraitsTabProps {
  talents: TalentsAndTraitsBlock;
  editable: boolean;
  onUpdateTalents: (next: TalentsAndTraitsBlock) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TraitsTab({ talents, editable, onUpdateTalents }: TraitsTabProps) {
  const handleAddTrait = useCallback(
    (entry: TalentEntry) => {
      onUpdateTalents({ ...talents, traits: [...talents.traits, entry] });
    },
    [talents, onUpdateTalents]
  );

  const handleRemoveTrait = useCallback(
    (uid: string) => {
      onUpdateTalents({
        ...talents,
        traits: talents.traits.filter((t) => t.uid !== uid),
      });
    },
    [talents, onUpdateTalents]
  );

  return (
    <div className="space-y-8">
      <EntrySection
        title="Traits"
        singular="Trait"
        entries={talents.traits}
        listData={TRAIT_LIST}
        editable={editable}
        onAdd={handleAddTrait}
        onRemove={handleRemoveTrait}
      />
    </div>
  );
}
