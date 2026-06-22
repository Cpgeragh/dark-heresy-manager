// src/pages/characterSheet/CyberneticsTab/index.tsx

import { useState, useCallback } from "react";
import type {
  CyberneticItem,
  CyberneticCraftsmanship,
  ArmourLocationKey,
} from "../../../types/Character";
import type { CyberneticRef } from "../../../data/reference/cyberneticsReference";
import { ImplantPicker } from "./ImplantPicker";
import { ImplantRow } from "./ImplantRow";
import { nextAvailableCraftsmanship } from "./cyberneticsHelpers";
import { SectionHeader } from "../../../ui/SectionHeader";
import { CYBERNETICS_REFERENCE } from "../../../data/reference/cyberneticsReference";
import { uiTextPlaceholder } from "../../../ui/editableStyles";

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
    (
      ref: CyberneticRef,
      craftsmanship: CyberneticCraftsmanship,
      bodyLocation?: ArmourLocationKey[],
      gmValue?: string,
      gmRarity?: string
    ) => {
      if (!editable) return;
      onUpdate([
        ...cybernetics,
        {
          id: crypto.randomUUID(),
          referenceId: ref.id,
          name: ref.name,
          craftsmanship,
          value: gmValue ?? ref.value,
          availability: gmRarity ?? ref.availability,
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
          <SectionHeader>Installed Implants ({cybernetics.length})</SectionHeader>
          <button
            onClick={() => setShowPicker(true)}
            className="text-xs lg:text-sm px-3 lg:px-4 py-1 lg:py-1.5 rounded border border-red-500 text-red-500 font-semibold hover:bg-red-500/10 transition"
          >
            {editable ? "+ Install" : "View"}
          </button>
        </div>

        {cybernetics.length === 0 && (
          <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No cybernetics installed.</p>
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

      {showPicker && (
        <ImplantPicker
          editable={editable}
          onSelect={install}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
