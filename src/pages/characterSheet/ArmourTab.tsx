// src/pages/characterSheet/ArmourTab.tsx

import type { ArmourBlock, ArmourLocation } from "../../types/Character";

interface ArmourTabProps {
  armour: ArmourBlock;
  editable: boolean;
  onUpdate: (next: ArmourBlock) => void;
}

export function ArmourTab({
  armour,
  editable,
  onUpdate,
}: ArmourTabProps) {
  function updateLocation(
    key: keyof ArmourBlock,
    next: ArmourLocation
  ) {
    if (!editable) return;
    onUpdate({
      ...armour,
      [key]: next,
    });
  }

  function LocationRow({
    label,
    locKey,
  }: {
    label: string;
    locKey: keyof ArmourBlock;
  }) {
    const loc = armour[locKey];

    return (
      <div className="flex items-center gap-3">
        <div className="w-24 text-sm text-slate-300">{label}</div>

        <input
          type="number"
          min={0}
          disabled={!editable}
          value={loc.ap}
          onChange={(e) =>
            updateLocation(locKey, {
              ...loc,
              ap: Number(e.target.value),
            })
          }
          className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-100 text-sm"
        />

        <input
          type="text"
          placeholder="Type (e.g. Flak)"
          disabled={!editable}
          value={loc.type ?? ""}
          onChange={(e) =>
            updateLocation(locKey, {
              ...loc,
              type: e.target.value,
            })
          }
          className="flex-1 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-100 text-sm"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-300">
      <h2 className="text-xl font-semibold">Armour</h2>

      <p className="text-xs text-slate-400">
        Armour Points (AP) are applied per hit location as per Dark Heresy 1st Edition.
      </p>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-3">
          <LocationRow label="Head" locKey="head" />
          <LocationRow label="Right Arm" locKey="rightArm" />
          <LocationRow label="Left Arm" locKey="leftArm" />
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-3">
          <LocationRow label="Body" locKey="body" />
          <LocationRow label="Right Leg" locKey="rightLeg" />
          <LocationRow label="Left Leg" locKey="leftLeg" />
        </div>
      </div>
    </div>
  );
}