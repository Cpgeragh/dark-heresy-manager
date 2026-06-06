// src/pages/characterSheet/CyberneticsTab/index.tsx

import { useState, useCallback } from "react";
import type { CyberneticItem, CyberneticCraftsmanship, ArmourLocationKey } from "../../../types/Character";
import type { CyberneticRef } from "../../../data/reference/cyberneticsReference";
import { ImplantPicker } from "./ImplantPicker";
import { ImplantRow } from "./ImplantRow";
import { nextAvailableCraftsmanship } from "./cyberneticsHelpers";
import { uiSectionHeader } from "../../../ui/editableStyles";
import { CYBERNETICS_REFERENCE } from "../../../data/reference/cyberneticsReference";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CyberneticsTabProps {
  cybernetics: CyberneticItem[];
  editable: boolean;
  onUpdate: (next: CyberneticItem[]) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CyberneticsTab({ cybernetics, editable, onUpdate }: CyberneticsTabProps) {
  const [showPicker, setShowPicker] = useState(false);

  const install = useCallback(
    (ref: CyberneticRef, craftsmanship: CyberneticCraftsmanship, bodyLocation?: ArmourLocationKey[]) => {
      if (!editable) return;
      onUpdate([
        ...cybernetics,
        {
          id: crypto.randomUUID(),
          referenceId: ref.id,
          name: ref.name,
          craftsmanship,
          value: ref.value,
          rarity: ref.rarity,
          source: ref.source,
          ...(bodyLocation ? { bodyLocation } : {}),
        },
      ]);
      setShowPicker(false);
    },
    [editable, cybernetics, onUpdate]
  );

  const cycleQuality = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdate(
        cybernetics.map((c) => {
          if (c.id !== id) return c;
          const ref = CYBERNETICS_REFERENCE.find((r) => r.id === c.referenceId);
          return { ...c, craftsmanship: nextAvailableCraftsmanship(c.craftsmanship, ref) };
        })
      );
    },
    [editable, cybernetics, onUpdate]
  );

  const removeImplant = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdate(cybernetics.filter((c) => c.id !== id));
    },
    [editable, cybernetics, onUpdate]
  );

  const cyberneticColumns = [
    cybernetics.filter((_, index) => index % 2 === 0),
    cybernetics.filter((_, index) => index % 2 === 1),
  ];

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className={uiSectionHeader}>
            Installed Implants ({cybernetics.length})
          </h3>
          {editable && (
            <button
              onClick={() => setShowPicker(true)}
              className="text-xs px-3 py-1 rounded border border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700 transition"
            >
              + Install
            </button>
          )}
        </div>

        {cybernetics.length === 0 && (
          <p className="text-sm text-slate-500 italic">No cybernetics installed.</p>
        )}

        <div className="space-y-3 sm:hidden">
          {cybernetics.map((item) => (
            <ImplantRow
              key={item.id}
              item={item}
              editable={editable}
              onCycleQuality={cycleQuality}
              onRemove={removeImplant}
            />
          ))}
        </div>

        <div className="hidden sm:grid sm:grid-cols-2 sm:gap-3 sm:items-start">
          {cyberneticColumns.map((column, index) => (
            <div key={index} className="space-y-3">
              {column.map((item) => (
                <ImplantRow
                  key={item.id}
                  item={item}
                  editable={editable}
                  onCycleQuality={cycleQuality}
                  onRemove={removeImplant}
                />
              ))}
            </div>
          ))}
        </div>
      </section>

      <p className="text-xs text-slate-600">
        Cost shown is for Common craftsmanship. Available qualities depend on the implant's rules.
      </p>

      {showPicker && (
        <ImplantPicker
          onSelect={install}
          onClose={() => setShowPicker(false)}
        />
      )}

    </div>
  );
}
