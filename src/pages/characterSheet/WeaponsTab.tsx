// src/pages/characterSheet/WeaponsTab.tsx

import { useCallback } from "react";
import type {
  RangedWeapon,
  MeleeWeapon,
} from "../../types/Character";
import { sectionContainerClass } from "../../ui/editableStyles";
import { FormField } from "../../components/FormField";

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
  const updateRanged = useCallback(
    (index: number, key: keyof RangedWeapon, value: string) => {
      if (!editable) return;
      const next = [...rangedWeapons];
      next[index] = { ...next[index], [key]: value };
      onUpdateRanged(next);
    },
    [editable, rangedWeapons, onUpdateRanged]
  );

  const updateMelee = useCallback(
    (index: number, key: keyof MeleeWeapon, value: string) => {
      if (!editable) return;
      const next = [...meleeWeapons];
      next[index] = { ...next[index], [key]: value };
      onUpdateMelee(next);
    },
    [editable, meleeWeapons, onUpdateMelee]
  );

  // Memoized handler factories
  const createRangedFieldHandler = useCallback(
    (index: number, key: keyof RangedWeapon) => (value: string) => {
      updateRanged(index, key, value);
    },
    [updateRanged]
  );

  const createMeleeFieldHandler = useCallback(
    (index: number, key: keyof MeleeWeapon) => (value: string) => {
      updateMelee(index, key, value);
    },
    [updateMelee]
  );

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

  return (
    <div className="space-y-8 text-slate-300">
      <h2 className="text-xl font-semibold">Weapons</h2>

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
                  className={sectionContainerClass(editable) + " space-y-2"}
                >
                  <div className="flex items-center justify-between gap-2">
                    <FormField
                      label="Weapon"
                      value={w.name ?? ""}
                      onChange={createRangedFieldHandler(i, "name")}
                      editable={editable}
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
                    <FormField label="Class" value={w.class ?? ""} onChange={createRangedFieldHandler(i, "class")} editable={editable} />
                    <FormField label="Damage" value={w.damage ?? ""} onChange={createRangedFieldHandler(i, "damage")} editable={editable} />
                    <FormField label="Type" value={w.type ?? ""} onChange={createRangedFieldHandler(i, "type")} editable={editable} />
                    <FormField label="Pen" value={w.pen ?? ""} onChange={createRangedFieldHandler(i, "pen")} editable={editable} />
                    <FormField label="Range" value={w.range ?? ""} onChange={createRangedFieldHandler(i, "range")} editable={editable} />
                    <FormField label="RoF" value={w.rof ?? ""} onChange={createRangedFieldHandler(i, "rof")} editable={editable} />
                    <FormField label="Clip" value={w.clip ?? ""} onChange={createRangedFieldHandler(i, "clip")} editable={editable} />
                    <FormField label="Reload" value={w.rld ?? ""} onChange={createRangedFieldHandler(i, "rld")} editable={editable} />
                  </div>

                  <FormField
                    label="Special"
                    value={w.specialRules ?? ""}
                    onChange={createRangedFieldHandler(i, "specialRules")}
                    editable={editable}
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
                  className={sectionContainerClass(editable) + " space-y-2"}
                >
                  <div className="flex items-center justify-between gap-2">
                    <FormField
                      label="Weapon"
                      value={w.name ?? ""}
                      onChange={createMeleeFieldHandler(i, "name")}
                      editable={editable}
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
                    <FormField label="Class" value={w.class ?? ""} onChange={createMeleeFieldHandler(i, "class")} editable={editable} />
                    <FormField label="Damage" value={w.damage ?? ""} onChange={createMeleeFieldHandler(i, "damage")} editable={editable} />
                    <FormField label="Type" value={w.type ?? ""} onChange={createMeleeFieldHandler(i, "type")} editable={editable} />
                    <FormField label="Pen" value={w.pen ?? ""} onChange={createMeleeFieldHandler(i, "pen")} editable={editable} />
                  </div>

                  <FormField
                    label="Special"
                    value={w.specialRules ?? ""}
                    onChange={createMeleeFieldHandler(i, "specialRules")}
                    editable={editable}
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