// src/pages/characterSheet/TalentsTab.tsx

import type {
  TalentsAndTraitsBlock,
  WeaponTrainingBlock,
  WeaponTrainingTalentId,
} from "../../types/Character";

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

  const toggleTraining = (id: WeaponTrainingTalentId) => {
    if (!editable) return;

    const trained = new Set(weaponTraining.trained);

    if (trained.has(id)) trained.delete(id);
    else trained.add(id);

    onUpdateTraining({
      ...weaponTraining,
      trained: Array.from(trained),
    });
  };

  return (
    <div className="space-y-6 text-slate-300">
      {/* HOMEWORLD / BACKGROUND */}
      <div>
        <h3 className="font-semibold mb-1">Homeworld / Background</h3>
        {editable ? (
          <textarea
            className="w-full h-20 bg-slate-800 border border-slate-600 p-2 rounded"
            value={talents.homeworldBackground}
            onChange={(e) =>
              onUpdateTalents({
                ...talents,
                homeworldBackground: e.target.value,
              })
            }
          />
        ) : (
          <p className="whitespace-pre-wrap">
            {talents.homeworldBackground || "None"}
          </p>
        )}
      </div>

      {/* TALENTS / TRAITS */}
      <div>
        <h3 className="font-semibold mb-1">Talents / Traits / Advances</h3>
        {editable ? (
          <textarea
            className="w-full h-28 bg-slate-800 border border-slate-600 p-2 rounded"
            value={talents.advancesTalentsAndTraits}
            onChange={(e) =>
              onUpdateTalents({
                ...talents,
                advancesTalentsAndTraits: e.target.value,
              })
            }
          />
        ) : (
          <p className="whitespace-pre-wrap">
            {talents.advancesTalentsAndTraits || "None"}
          </p>
        )}
      </div>

      {/* WEAPON TRAINING */}
      <div>
        <h3 className="font-semibold mb-2">Weapon Training</h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {weaponList.map((id) => {
            const trained = weaponTraining.trained.includes(id);
            return (
              <label key={id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  disabled={!editable}
                  checked={trained}
                  onChange={() => toggleTraining(id)}
                />
                <span className={trained ? "text-white" : "text-slate-500"}>
                  {id}
                </span>
              </label>
            );
          })}
        </div>

        {/* EXOTIC NOTES */}
        <div className="mt-3">
          <h4 className="font-semibold mb-1">Exotic Notes</h4>
          {editable ? (
            <textarea
              className="w-full h-16 bg-slate-800 border border-slate-600 p-2 rounded"
              value={weaponTraining.exoticNotes ?? ""}
              onChange={(e) =>
                onUpdateTraining({
                  ...weaponTraining,
                  exoticNotes: e.target.value,
                })
              }
            />
          ) : (
            <p className="whitespace-pre-wrap">
              {weaponTraining.exoticNotes || "None"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}