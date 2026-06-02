// src/pages/characterSheet/CyberneticsTab/index.tsx

import { useState, useCallback } from "react";
import type { CyberneticItem, CyberneticCraftsmanship, ArmourLocationKey } from "../../../types/Character";
import type { CyberneticRef } from "../../../data/reference/cyberneticsReference";
import { CyberneticInfoModal } from "./CyberneticInfoModal";
import { ImplantPicker } from "./ImplantPicker";
import { ImplantRow } from "./ImplantRow";
import { nextCraftsmanship } from "./cyberneticsHelpers";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CyberneticsTabProps {
  cybernetics: CyberneticItem[];
  editable: boolean;
  onUpdate: (next: CyberneticItem[]) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CyberneticsTab({ cybernetics, editable, onUpdate }: CyberneticsTabProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [infoTarget, setInfoTarget] = useState<CyberneticItem | null>(null);

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
        cybernetics.map((c) =>
          c.id === id ? { ...c, craftsmanship: nextCraftsmanship(c.craftsmanship) } : c
        )
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

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
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

        {cybernetics.map((item) => (
          <ImplantRow
            key={item.id}
            item={item}
            editable={editable}
            onCycleQuality={cycleQuality}
            onRemove={removeImplant}
            onInfo={setInfoTarget}
          />
        ))}
      </section>

      <p className="text-xs text-slate-600">
        Cost shown is for Common craftsmanship. Click the quality badge to cycle between Poor, Common and Good.
      </p>

      {showPicker && (
        <ImplantPicker
          onSelect={install}
          onClose={() => setShowPicker(false)}
        />
      )}

      {infoTarget && (
        <CyberneticInfoModal
          item={infoTarget}
          onClose={() => setInfoTarget(null)}
        />
      )}
    </div>
  );
}
