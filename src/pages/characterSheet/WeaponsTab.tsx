import type {
  RangedWeapon,
  MeleeWeapon,
} from "../../types/Character";

interface WeaponsTabProps {
  rangedWeapons: RangedWeapon[];
  meleeWeapons: MeleeWeapon[];
  editable: boolean;
  onUpdateRanged: (next: RangedWeapon[]) => void;
  onUpdateMelee: (next: MeleeWeapon[]) => void;
}

export function WeaponsTab({
  rangedWeapons,
  meleeWeapons,
  editable,
  onUpdateRanged,
  onUpdateMelee,
}: WeaponsTabProps) {
  function updateRanged(index: number, key: keyof RangedWeapon, value: string) {
    if (!editable) return;
    const next = [...rangedWeapons];
    next[index] = { ...next[index], [key]: value };
    onUpdateRanged(next);
  }

  function updateMelee(index: number, key: keyof MeleeWeapon, value: string) {
    if (!editable) return;
    const next = [...meleeWeapons];
    next[index] = { ...next[index], [key]: value };
    onUpdateMelee(next);
  }

  function addRanged() {
    if (!editable) return;
    onUpdateRanged([
      ...rangedWeapons,
      { id: crypto.randomUUID(), name: "" },
    ]);
  }

  function addMelee() {
    if (!editable) return;
    onUpdateMelee([
      ...meleeWeapons,
      { id: crypto.randomUUID(), name: "" },
    ]);
  }

  function removeRanged(index: number) {
    if (!editable) return;
    const next = [...rangedWeapons];
    next.splice(index, 1);
    onUpdateRanged(next);
  }

  function removeMelee(index: number) {
    if (!editable) return;
    const next = [...meleeWeapons];
    next.splice(index, 1);
    onUpdateMelee(next);
  }

  function Field({
    label,
    value,
    onChange,
  }: {
    label: string;
    value?: string;
    onChange: (v: string) => void;
  }) {
    return (
      <label className="flex flex-col gap-0.5 text-xs text-slate-400">
        {label}
        <input
          disabled={!editable}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200"
        />
      </label>
    );
  }

  return (
    <div className="space-y-8 text-slate-300">
      <h2 className="text-xl font-semibold">Weapons</h2>

      {/* RANGED + MELEE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RANGED */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Ranged Weapons</h3>
            {editable && (
              <button
                onClick={addRanged}
                className="text-xs px-3 py-1 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700"
              >
                + Add
              </button>
            )}
          </div>

          {rangedWeapons.length === 0 ? (
            <p className="text-sm text-slate-400">
              No ranged weapons recorded.
            </p>
          ) : (
            <div className="space-y-3">
              {rangedWeapons.map((w, i) => (
                <div
                  key={w.id}
                  className="rounded border border-slate-700 bg-slate-900/40 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Field
                      label="Weapon"
                      value={w.name}
                      onChange={(v) => updateRanged(i, "name", v)}
                    />

                    {editable && (
                      <button
                        onClick={() => removeRanged(i)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <Field label="Class" value={w.class} onChange={(v) => updateRanged(i, "class", v)} />
                    <Field label="Damage" value={w.damage} onChange={(v) => updateRanged(i, "damage", v)} />
                    <Field label="Type" value={w.type} onChange={(v) => updateRanged(i, "type", v)} />
                    <Field label="Pen" value={w.pen} onChange={(v) => updateRanged(i, "pen", v)} />
                    <Field label="Range" value={w.range} onChange={(v) => updateRanged(i, "range", v)} />
                    <Field label="RoF" value={w.rof} onChange={(v) => updateRanged(i, "rof", v)} />
                    <Field label="Clip" value={w.clip} onChange={(v) => updateRanged(i, "clip", v)} />
                    <Field label="Reload" value={w.rld} onChange={(v) => updateRanged(i, "rld", v)} />
                  </div>

                  <Field
                    label="Special"
                    value={w.specialRules}
                    onChange={(v) => updateRanged(i, "specialRules", v)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* MELEE */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Melee Weapons</h3>
            {editable && (
              <button
                onClick={addMelee}
                className="text-xs px-3 py-1 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700"
              >
                + Add
              </button>
            )}
          </div>

          {meleeWeapons.length === 0 ? (
            <p className="text-sm text-slate-400">
              No melee weapons recorded.
            </p>
          ) : (
            <div className="space-y-3">
              {meleeWeapons.map((w, i) => (
                <div
                  key={w.id}
                  className="rounded border border-slate-700 bg-slate-900/40 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Field
                      label="Weapon"
                      value={w.name}
                      onChange={(v) => updateMelee(i, "name", v)}
                    />

                    {editable && (
                      <button
                        onClick={() => removeMelee(i)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <Field label="Class" value={w.class} onChange={(v) => updateMelee(i, "class", v)} />
                    <Field label="Damage" value={w.damage} onChange={(v) => updateMelee(i, "damage", v)} />
                    <Field label="Type" value={w.type} onChange={(v) => updateMelee(i, "type", v)} />
                    <Field label="Pen" value={w.pen} onChange={(v) => updateMelee(i, "pen", v)} />
                  </div>

                  <Field
                    label="Special"
                    value={w.specialRules}
                    onChange={(v) => updateMelee(i, "specialRules", v)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}