// src/pages/characterSheet/TalentsTab.tsx

import type {
  TalentsAndTraitsBlock,
  WeaponTrainingBlock,
  WeaponTrainingTalentId,
} from "../../types/Character";

import {
  editableTextareaClass,
  sectionContainerClass,
} from "../../ui/editableStyles";

interface TalentsTabProps {
  talents: TalentsAndTraitsBlock;
  weaponTraining: WeaponTrainingBlock;
  editable: boolean;

  onUpdateTalents: (value: TalentsAndTraitsBlock) => void;
  onUpdateTraining: (value: WeaponTrainingBlock) => void;
}

export function TalentsTab({
  talents,
  weaponTraining,
  editable,
  onUpdateTalents,
  onUpdateTraining,
}: TalentsTabProps) {
  const weaponList: WeaponTrainingTalentId[] = [
    "basic-bolt", "basic-flame", "basic-las", "basic-launcher",
    "basic-melta", "basic-plasma", "basic-primitive", "basic-sp",
    "pistol-bolt", "pistol-flame", "pistol-las", "pistol-launcher",
    "pistol-melta", "pistol-plasma", "pistol-primitive", "pistol-sp",
    "melee-primitive", "melee-chain", "melee-shock", "melee-power",
    "exotic",
  ];

  function toggleTraining(id: WeaponTrainingTalentId) {
    if (!editable) return;

    const trained = new Set(weaponTraining.trained);
    trained.has(id) ? trained.delete(id) : trained.add(id);

    onUpdateTraining({
      ...weaponTraining,
      trained: Array.from(trained),
    });
  }

  return (
    <div className="space-y-6 text-slate-300">
      <h2 className="text-xl font-semibold">Talents & Training</h2>

      {/* HOMEWORLD / BACKGROUND */}
      <section className={sectionContainerClass(editable)}>
        <h3 className="text-lg font-semibold text-slate-200 mb-2">
          Homeworld / Background
        </h3>

        <textarea
          disabled={!editable}
          className={editableTextareaClass(editable) + " min-h-[80px]"}
          value={talents.homeworldBackground}
          onChange={(e) =>
            onUpdateTalents({
              ...talents,
              homeworldBackground: e.target.value,
            })
          }
          placeholder={!editable ? "Read-only" : undefined}
        />
      </section>

      {/* TALENTS / TRAITS */}
      <section className={sectionContainerClass(editable)}>
        <h3 className="text-lg font-semibold text-slate-200 mb-2">
          Talents, Traits & Advances
        </h3>

        <textarea
          disabled={!editable}
          className={editableTextareaClass(editable) + " min-h-[120px]"}
          value={talents.advancesTalentsAndTraits}
          onChange={(e) =>
            onUpdateTalents({
              ...talents,
              advancesTalentsAndTraits: e.target.value,
            })
          }
          placeholder={!editable ? "Read-only" : undefined}
        />
      </section>

      {/* WEAPON TRAINING */}
      <section className={sectionContainerClass(editable)}>
        <h3 className="text-lg font-semibold text-slate-200 mb-3">
          Weapon Training
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {weaponList.map((id) => {
            const trained = weaponTraining.trained.includes(id);

            return (
              <label
                key={id}
                className={`flex items-center gap-2 text-sm
                  ${
                    editable
                      ? "cursor-pointer"
                      : "cursor-not-allowed opacity-60"
                  }
                  ${trained ? "text-slate-100" : "text-slate-500"}
                `}
              >
                <input
                  type="checkbox"
                  disabled={!editable}
                  checked={trained}
                  onChange={() => toggleTraining(id)}
                />
                <span className="font-mono text-xs">{id}</span>
              </label>
            );
          })}
        </div>

        {/* EXOTIC NOTES */}
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-slate-300 mb-1">
            Exotic Weapon Notes
          </h4>

          <textarea
            disabled={!editable}
            className={editableTextareaClass(editable) + " min-h-[60px]"}
            value={weaponTraining.exoticNotes ?? ""}
            onChange={(e) =>
              onUpdateTraining({
                ...weaponTraining,
                exoticNotes: e.target.value,
              })
            }
            placeholder={!editable ? "Read-only" : undefined}
          />
        </div>
      </section>
    </div>
  );
}