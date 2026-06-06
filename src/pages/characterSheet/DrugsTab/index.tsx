// src/pages/characterSheet/DrugsTab/index.tsx

import { useState, useCallback } from "react";
import type { DrugItem } from "../../../types/Character";
import type { DrugRef } from "../../../data/reference/drugsReference";
import { DrugInfoModal } from "./DrugInfoModal";
import { DrugPicker } from "./DrugPicker";
import { DrugRow } from "./DrugRow";
import { uiSectionHeader } from "../../../ui/editableStyles";

interface DrugsTabProps {
  drugs: DrugItem[];
  editable: boolean;
  onUpdate: (next: DrugItem[]) => void;
}

export function DrugsTab({ drugs, editable, onUpdate }: DrugsTabProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [infoTarget, setInfoTarget] = useState<DrugItem | null>(null);

  const addDrug = useCallback(
    (ref: DrugRef) => {
      if (!editable) return;
      onUpdate([
        ...drugs,
        {
          id: crypto.randomUUID(),
          referenceId: ref.id,
          name: ref.name,
          quantity: 1,
          value: ref.value,
          rarity: ref.rarity,
          source: ref.source,
        },
      ]);
      setShowPicker(false);
    },
    [editable, drugs, onUpdate]
  );

  const updateQty = useCallback(
    (id: string, quantity: number) => {
      if (!editable) return;
      onUpdate(drugs.map((d) => (d.id === id ? { ...d, quantity } : d)));
    },
    [editable, drugs, onUpdate]
  );

  const removeDrug = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdate(drugs.filter((d) => d.id !== id));
    },
    [editable, drugs, onUpdate]
  );

  const drugColumns = [
    drugs.filter((_, index) => index % 2 === 0),
    drugs.filter((_, index) => index % 2 === 1),
  ];

  return (
    <div className="space-y-6">
      {/* Excessive Drug Use rule */}
      <div className="rounded-lg border border-violet-700/40 bg-violet-900/10 px-4 py-3 text-xs text-slate-400 leading-relaxed">
        <span className="font-semibold text-violet-400 uppercase tracking-wide mr-1">
          Excessive Drug Use ·
        </span>
        Using more than one dose of the same drug within a 24-hour period requires a Toughness Test
        for each use after the first, with a cumulative –20 penalty. On a failure, the drug has no
        effect and further doses do not affect the character for a full 24 hours.
      </div>

      {/* Carried drugs */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className={uiSectionHeader}>
            Carried ({drugs.length})
          </h3>
          {editable && (
            <button
              onClick={() => setShowPicker(true)}
              className="text-xs px-3 py-1 rounded border border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700 transition"
            >
              + Add
            </button>
          )}
        </div>

        {drugs.length === 0 && (
          <p className="text-sm text-slate-500 italic">No drugs carried.</p>
        )}

        <div className="space-y-3 sm:hidden">
          {drugs.map((item) => (
            <DrugRow
              key={item.id}
              item={item}
              editable={editable}
              onUpdateQty={updateQty}
              onRemove={removeDrug}
              onInfo={setInfoTarget}
            />
          ))}
        </div>

        <div className="hidden sm:grid sm:grid-cols-2 sm:gap-3 sm:items-start">
          {drugColumns.map((column, index) => (
            <div key={index} className="space-y-3">
              {column.map((item) => (
                <DrugRow
                  key={item.id}
                  item={item}
                  editable={editable}
                  onUpdateQty={updateQty}
                  onRemove={removeDrug}
                  onInfo={setInfoTarget}
                />
              ))}
            </div>
          ))}
        </div>
      </section>

      <p className="text-xs text-slate-600">
        Cost shown is per dose. Tap ⓘ to view full effect, duration and side effects.
      </p>

      {showPicker && (
        <DrugPicker
          onSelect={addDrug}
          onClose={() => setShowPicker(false)}
        />
      )}

      {infoTarget && (
        <DrugInfoModal
          item={infoTarget}
          onClose={() => setInfoTarget(null)}
        />
      )}
    </div>
  );
}
