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
      <h2 className="text-xl font-semibold">Talents & Training</h2>

      {/* HOMEWORLD / BACKGROUND */}
      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-200">
          Homeworld / Background
        </h3>

        {editable ? (
          <textarea
            className="w-full min-h-[80px] bg-slate-900 border border-slate-700
                       rounded px-3 py-2 text-sm text-slate-100 resize-y"
            value={talents.homeworldBackground}
            onChange={(e) =>
              onUpdateTalents({
                ...talents,
                homeworldBackground: e.target.value,
              })
            }
          />
        ) : (
          <div className="rounded border border-slate-700 bg-slate-900/40 p-3 text-sm">
            {talents.homeworldBackground || "None"}
          </div>
        )}
      </section>

      {/* TALENTS / TRAITS */}
      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-200">
          Talents, Traits & Advances
        </h3>

        {editable ? (
          <textarea
            className="w-full min-h-[120px] bg-slate-900 border border-slate-700
                       rounded px-3 py-2 text-sm text-slate-100 resize-y"
            value={talents.advancesTalentsAndTraits}
            onChange={(e) =>
              onUpdateTalents({
                ...talents,
                advancesTalentsAndTraits: e.target.value,
              })
            }
          />
        ) : (
          <div className="rounded border border-slate-700 bg-slate-900/40 p-3 text-sm whitespace-pre-wrap">
            {talents.advancesTalentsAndTraits || "None"}
          </div>
        )}
      </section>

      {/* WEAPON TRAINING */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-200">
          Weapon Training
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2
                        rounded border border-slate-700 bg-slate-900/30 p-3">
          {weaponList.map((id) => {
            const trained = weaponTraining.trained.includes(id);

            return (
              <label
                key={id}
                className={`flex items-center gap-2 text-sm cursor-pointer
                  ${trained ? "text-slate-100" : "text-slate-500"}`}
              >
                <input
                  type="checkbox"
                  disabled={!editable}
                  checked={trained}
                  onChange={() => toggleTraining(id)}
                />
                <span className="font-mono text-xs">
                  {id}
                </span>
              </label>
            );
          })}
        </div>

        {/* EXOTIC NOTES */}
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-slate-300">
            Exotic Weapon Notes
          </h4>

          {editable ? (
            <textarea
              className="w-full min-h-[60px] bg-slate-900 border border-slate-700
                         rounded px-3 py-2 text-sm text-slate-100 resize-y"
              value={weaponTraining.exoticNotes ?? ""}
              onChange={(e) =>
                onUpdateTraining({
                  ...weaponTraining,
                  exoticNotes: e.target.value,
                })
              }
            />
          ) : (
            <div className="rounded border border-slate-700 bg-slate-900/40 p-3 text-sm">
              {weaponTraining.exoticNotes || "None"}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}