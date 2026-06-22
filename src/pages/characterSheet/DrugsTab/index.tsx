// src/pages/characterSheet/DrugsTab/index.tsx

import { useState, useCallback } from "react";
import type { DrugItem } from "../../../types/Character";
import type { DrugRef } from "../../../data/reference/drugsReference";
import { DrugPicker } from "./DrugPicker";
import { DrugRow } from "./DrugRow";
import { SectionHeader } from "../../../ui/SectionHeader";
import { uiTextBody, uiTextPlaceholder } from "../../../ui/editableStyles";

interface DrugsTabProps {
  drugs: DrugItem[];
  editable: boolean;
  onUpdate: (next: DrugItem[]) => void;
}

export function DrugsTab({ drugs, editable, onUpdate }: DrugsTabProps) {
  const [showPicker, setShowPicker] = useState(false);

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
          weight: ref.weight ?? "0 kg",
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
      <div className={`rounded-lg border border-violet-700/40 bg-violet-900/10 px-4 lg:px-5 py-3 lg:py-4 text-xs lg:text-sm ${uiTextBody} leading-relaxed`}>
        <span className="font-semibold text-violet-400 uppercase tracking-wide mr-1">
          Excessive Drug Use -
        </span>
        Using more than one dose of the same drug within a 24-hour period requires a Toughness Test
        for each use after the first, with a cumulative -20 penalty. On a failure, the drug has no
        effect and further doses do not affect the character for a full 24 hours.
      </div>

      {/* Carried drugs */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionHeader>Carried ({drugs.length})</SectionHeader>
          <button
            onClick={() => setShowPicker(true)}
            className="text-xs lg:text-sm px-3 lg:px-4 py-1 lg:py-1.5 rounded border border-red-500 text-red-500 font-semibold hover:bg-red-500/10 transition"
          >
            {editable ? "+ Add" : "View"}
          </button>
        </div>

        {drugs.length === 0 && <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No drugs carried.</p>}

        <div className="space-y-3 sm:hidden">
          {drugs.map((item) => (
            <DrugRow
              key={item.id}
              item={item}
              editable={editable}
              onUpdateQty={updateQty}
              onRemove={removeDrug}
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
                />
              ))}
            </div>
          ))}
        </div>
      </section>

      {showPicker && (
        <DrugPicker
          editable={editable}
          onSelect={addDrug}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
