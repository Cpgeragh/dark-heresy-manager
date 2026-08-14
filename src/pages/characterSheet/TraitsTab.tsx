// src/pages/characterSheet/TraitsTab.tsx

import { useCallback } from "react";
import type { TalentsAndTraitsBlock, TalentEntry } from "../../types/Character";
import { TRAIT_LIST } from "../../data/traitData";
import { EntrySection } from "./talentComponents";
import { getGrantedTraitEntries } from "../../features/talents/talentEffects";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TraitsTabProps {
  talents: TalentsAndTraitsBlock;
  editable: boolean;
  onUpdateTalents: (next: TalentsAndTraitsBlock) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TraitsTab({ talents, editable, onUpdateTalents }: TraitsTabProps) {
  const displayTraits = [...talents.traits, ...getGrantedTraitEntries(talents)];
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
        entries={displayTraits}
        listData={TRAIT_LIST}
        editable={editable}
        columns={2}
        onAdd={handleAddTrait}
        onRemove={handleRemoveTrait}
      />
    </div>
  );
}
