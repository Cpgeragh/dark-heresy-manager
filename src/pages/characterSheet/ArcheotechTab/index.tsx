// src/pages/characterSheet/ArcheotechTab/index.tsx

import { useState, useCallback } from "react";
import type { ArcheotechItem } from "../../../types/Character";
import type { ArcheotechRef } from "../../../data/reference/archeotechReference";
import { ArcheotechPickerModal } from "./ArcheotechPickerModal";
import { ItemCard } from "./ItemCard";
import { CustomItemForm } from "./CustomItemForm";
import { SectionHeader } from "../../../ui/SectionHeader";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ArcheotechTabProps {
  archeotech: ArcheotechItem[];
  editable: boolean;
  onUpdate: (next: ArcheotechItem[]) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ArcheotechTab({ archeotech, editable, onUpdate }: ArcheotechTabProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);

  const addFromRef = useCallback(
    (ref: ArcheotechRef, gmValue?: string, gmRarity?: string) => {
      if (!editable) return;
      onUpdate([
        ...archeotech,
        {
          id: crypto.randomUUID(),
          referenceId: ref.id,
          name: ref.name,
          type: ref.type,
          source: ref.source,
          // Store GM-assigned values directly on the item so they override "—"
          value: gmValue || undefined,
          rarity: gmRarity || undefined,
        },
      ]);
      setShowPicker(false);
    },
    [editable, archeotech, onUpdate]
  );

  const addCustom = useCallback(
    (item: ArcheotechItem) => {
      if (!editable) return;
      onUpdate([...archeotech, item]);
      setShowCustomForm(false);
    },
    [editable, archeotech, onUpdate]
  );

  const removeItem = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdate(archeotech.filter((a) => a.id !== id));
    },
    [editable, archeotech, onUpdate]
  );

  const archeotechColumns = [
    archeotech.filter((_, index) => index % 2 === 0),
    archeotech.filter((_, index) => index % 2 === 1),
  ];

  return (
    <div className="space-y-8">
      {/* ── INVENTORY ─────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionHeader>Inventory ({archeotech.length})</SectionHeader>
          {!showCustomForm && (
            <button
              onClick={() => setShowPicker(true)}
              className="text-xs lg:text-sm px-3 lg:px-4 py-1 lg:py-1.5 rounded border border-red-500 text-red-500 font-semibold hover:bg-red-500/10 transition"
            >
              {editable ? "+ Add" : "View"}
            </button>
          )}
        </div>

        {archeotech.length === 0 && !showCustomForm && (
          <p className="text-sm lg:text-base text-slate-500 italic">No archeotech recorded.</p>
        )}

        <div className="space-y-3 sm:hidden">
          {archeotech.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              editable={editable}
              onRemove={() => removeItem(item.id)}
            />
          ))}
        </div>

        <div className="hidden sm:grid sm:grid-cols-2 sm:gap-3 sm:items-start">
          {archeotechColumns.map((column, index) => (
            <div key={index} className="space-y-3">
              {column.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  editable={editable}
                  onRemove={() => removeItem(item.id)}
                />
              ))}
            </div>
          ))}
        </div>

        {showCustomForm && (
          <CustomItemForm onAdd={addCustom} onCancel={() => setShowCustomForm(false)} />
        )}
      </section>

      {/* ── MODAL ─────────────────────────────────────────────────────────── */}
      {showPicker && (
        <ArcheotechPickerModal
          editable={editable}
          onSelect={addFromRef}
          onCustom={() => {
            setShowPicker(false);
            setShowCustomForm(true);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
