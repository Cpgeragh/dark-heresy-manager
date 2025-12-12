import type { RangedWeapon, MeleeWeapon } from "../../types/Character";

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

  function deleteRanged(index: number) {
    if (!editable) return;
    const next = [...rangedWeapons];
    next.splice(index, 1);
    onUpdateRanged(next);
  }

  function deleteMelee(index: number) {
    if (!editable) return;
    const next = [...meleeWeapons];
    next.splice(index, 1);
    onUpdateMelee(next);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Weapons</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RANGED WEAPONS */}
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Ranged Weapons</h3>

          {rangedWeapons.length === 0 && (
            <p className="text-sm text-slate-400">No ranged weapons.</p>
          )}

          <div className="space-y-2">
            {rangedWeapons.map((w, idx) => (
              <div
                key={w.id}
                className="border border-slate-700 rounded p-2 bg-slate-900/40 space-y-1"
              >
                <input
                  disabled={!editable}
                  placeholder="Weapon name"
                  value={w.name}
                  onChange={(e) =>
                    updateRanged(idx, "name", e.target.value)
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100 text-sm"
                />

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <input
                    disabled={!editable}
                    placeholder="Damage"
                    value={w.damage ?? ""}
                    onChange={(e) =>
                      updateRanged(idx, "damage", e.target.value)
                    }
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1"
                  />
                  <input
                    disabled={!editable}
                    placeholder="Range"
                    value={w.range ?? ""}
                    onChange={(e) =>
                      updateRanged(idx, "range", e.target.value)
                    }
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1"
                  />
                  <input
                    disabled={!editable}
                    placeholder="Pen"
                    value={w.pen ?? ""}
                    onChange={(e) =>
                      updateRanged(idx, "pen", e.target.value)
                    }
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1"
                  />
                  <input
                    disabled={!editable}
                    placeholder="RoF"
                    value={w.rof ?? ""}
                    onChange={(e) =>
                      updateRanged(idx, "rof", e.target.value)
                    }
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1"
                  />
                </div>

                {editable && (
                  <button
                    onClick={() => deleteRanged(idx)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          {editable && (
            <button
              onClick={addRanged}
              className="px-3 py-1 text-sm rounded bg-slate-800 border border-slate-600 hover:bg-slate-700"
            >
              + Add Ranged Weapon
            </button>
          )}
        </section>

        {/* MELEE WEAPONS */}
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Melee Weapons</h3>

          {meleeWeapons.length === 0 && (
            <p className="text-sm text-slate-400">No melee weapons.</p>
          )}

          <div className="space-y-2">
            {meleeWeapons.map((w, idx) => (
              <div
                key={w.id}
                className="border border-slate-700 rounded p-2 bg-slate-900/40 space-y-1"
              >
                <input
                  disabled={!editable}
                  placeholder="Weapon name"
                  value={w.name}
                  onChange={(e) =>
                    updateMelee(idx, "name", e.target.value)
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100 text-sm"
                />

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <input
                    disabled={!editable}
                    placeholder="Damage"
                    value={w.damage ?? ""}
                    onChange={(e) =>
                      updateMelee(idx, "damage", e.target.value)
                    }
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1"
                  />
                  <input
                    disabled={!editable}
                    placeholder="Pen"
                    value={w.pen ?? ""}
                    onChange={(e) =>
                      updateMelee(idx, "pen", e.target.value)
                    }
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1"
                  />
                </div>

                {editable && (
                  <button
                    onClick={() => deleteMelee(idx)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          {editable && (
            <button
              onClick={addMelee}
              className="px-3 py-1 text-sm rounded bg-slate-800 border border-slate-600 hover:bg-slate-700"
            >
              + Add Melee Weapon
            </button>
          )}
        </section>
      </div>
    </div>
  );
}