// src/pages/characterSheet/TalentsTab.tsx

import { useCallback } from "react";
import type { TalentsAndTraitsBlock, WeaponTrainingBlock } from "../../types/Character";
import { sectionContainerClass } from "../../ui/editableStyles";
import { FormField } from "../../components/FormField";

interface TalentsTabProps {
  talents: TalentsAndTraitsBlock;
  weaponTraining: WeaponTrainingBlock;
  editable: boolean;
  onUpdateTalents: (next: TalentsAndTraitsBlock) => void;
  onUpdateTraining: (next: WeaponTrainingBlock) => void;
}

export function TalentsTab({
  talents,
  weaponTraining,
  editable,
  onUpdateTalents,
  onUpdateTraining,
}: TalentsTabProps) {
  const updateTalents = useCallback((key: keyof TalentsAndTraitsBlock, value: string) => {
    if (!editable) return;
    onUpdateTalents({ ...talents, [key]: value });
  }, [editable, talents, onUpdateTalents]);

  const handleHomeworldChange = useCallback((v: string) => {
    updateTalents("homeworldBackground", v);
  }, [updateTalents]);

  const handleAdvancesChange = useCallback((v: string) => {
    updateTalents("advancesTalentsAndTraits", v);
  }, [updateTalents]);

  const updateWeaponTrainingNotes = useCallback((value: string) => {
    if (!editable) return;
    onUpdateTraining({ ...weaponTraining, exoticNotes: value });
  }, [editable, weaponTraining, onUpdateTraining]);

  return (
    <div className="space-y-8 text-slate-300">
      <h2 className="text-xl font-semibold">Talents & Traits</h2>

      {/* HOMEWORLD/BACKGROUND */}
      <section className={sectionContainerClass(editable) + " space-y-3"}>
        <h3 className="text-lg font-semibold">Background</h3>

        <FormField
          label="Homeworld Background"
          value={talents.homeworldBackground ?? ""}
          onChange={handleHomeworldChange}
          editable={editable}
          type="textarea"
          rows={3}
          placeholder="Description of homeworld and background..."
        />
      </section>

      {/* ADVANCES, TALENTS & TRAITS */}
      <section className={sectionContainerClass(editable) + " space-y-3"}>
        <h3 className="text-lg font-semibold">Advances, Talents & Traits</h3>

        <FormField
          label="Talents, Traits, and Special Abilities"
          value={talents.advancesTalentsAndTraits ?? ""}
          onChange={handleAdvancesChange}
          editable={editable}
          type="textarea"
          rows={8}
          placeholder="List all talents, traits, and special abilities here..."
          description="Include talent names, descriptions, and any special rules"
        />
      </section>

      {/* WEAPON TRAINING */}
      <section className={sectionContainerClass(editable) + " space-y-3"}>
        <h3 className="text-lg font-semibold">Weapon Training</h3>

        <div className="text-sm text-slate-400 mb-3">
          <p>Currently trained: {weaponTraining.trained?.length ?? 0} weapon types</p>
        </div>

        {weaponTraining.trained && weaponTraining.trained.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {weaponTraining.trained.map((id) => (
              <span
                key={id}
                className="px-2 py-1 text-xs rounded bg-slate-800 border border-slate-600 text-slate-300"
              >
                {id}
              </span>
            ))}
          </div>
        )}

        <FormField
          label="Exotic Weapon Notes"
          value={weaponTraining.exoticNotes ?? ""}
          onChange={updateWeaponTrainingNotes}
          editable={editable}
          type="textarea"
          rows={2}
          placeholder="Details about exotic weapon training..."
        />

        <p className="text-xs text-slate-500 mt-2">
          Note: Weapon training selection is managed through the character advancement system.
        </p>
      </section>
    </div>
  );
}