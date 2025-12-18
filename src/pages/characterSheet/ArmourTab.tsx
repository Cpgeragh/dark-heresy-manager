// src/pages/characterSheet/ArmourTab.tsx

import { useCallback } from "react";
import type { ArmourBlock, ArmourLocation } from "../../types/Character";
import {
  editableInputClass,
  sectionContainerClass,
} from "../../ui/editableStyles";

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
  const updateLocation = useCallback((
    key: keyof ArmourBlock,
    next: ArmourLocation
  ) => {
    if (!editable) return;
    onUpdate({
      ...armour,
      [key]: next,
    });
  }, [editable, armour, onUpdate]);

  function LocationRow({
    label,
    locKey,
  }: {
    label: string;
    locKey: keyof ArmourBlock;
  }) {
    const loc = armour[locKey];

    const handleAPChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      updateLocation(locKey, {
        ...loc,
        ap: Number(e.target.value),
      });
    }, [loc]);

    const handleTypeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      updateLocation(locKey, {
        ...loc,
        type: e.target.value,
      });
    }, [loc]);

    return (
      <div className="flex items-center gap-3">
        {/* Location label */}
        <div className="w-24 text-sm text-slate-300">
          {label}
        </div>

        {/* AP */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-500">AP</span>
          <input
            type="number"
            min={0}
            disabled={!editable}
            value={loc.ap}
            onChange={handleAPChange}
            className={editableInputClass(editable) + " w-16 font-mono"}
          />
        </div>

        {/* Armour type */}
        <input
          type="text"
          placeholder="Type (e.g. Flak)"
          disabled={!editable}
          value={loc.type ?? ""}
          onChange={handleTypeChange}
          className={editableInputClass(editable) + " flex-1"}
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

      {/* ARMOUR GRID */}
      <div
        className={
          sectionContainerClass(editable) +
          " grid grid-cols-1 md:grid-cols-2 gap-6"
        }
      >
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