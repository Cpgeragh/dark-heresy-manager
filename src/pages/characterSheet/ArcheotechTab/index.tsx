// src/pages/characterSheet/ArcheotechTab/index.tsx

import { useState, useCallback } from "react";
import type { ArcheotechItem } from "../../../types/Character";
import type { ArcheotechRef } from "../../../data/reference/archeotechReference";
import { ArcheotechPickerModal } from "./ArcheotechPickerModal";
import { ItemCard } from "./ItemCard";
import { CustomItemForm } from "./CustomItemForm";
import { uiSectionHeader } from "../../../ui/editableStyles";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ArcheotechTabProps {
  archeotech: ArcheotechItem[];
  editable: boolean;
  onUpdate: (next: ArcheotechItem[]) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ArcheotechTab({ archeotech, editable, onUpdate }: ArcheotechTabProps) {
  const [showPicker,     setShowPicker]     = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);

  const addFromRef = useCallback(
    (ref: ArcheotechRef, gmValue?: string, gmRarity?: string) => {
      if (!editable) return;
      onUpdate([
        ...archeotech,
        {
          id:          crypto.randomUUID(),
          referenceId: ref.id,
          name:        ref.name,
          type:        ref.type,
          source:      ref.source,
          // Store GM-assigned values directly on the item so they override "—"
          value:       gmValue  || undefined,
          rarity:      gmRarity || undefined,
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

  return (
    <div className="space-y-8">
      <p className="text-xs text-slate-400">
        Ancient technology of the Dark Age. Most items have no standard cost or availability —
        acquisition is left entirely to the GM.
      </p>

      {/* ── INVENTORY ─────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className={uiSectionHeader}>
            Inventory ({archeotech.length})
          </h3>
          {editable && !showCustomForm && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowPicker(true)}
                className="text-xs px-3 py-1 rounded border border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700 transition"
              >
                + From Reference
              </button>
              <button
                onClick={() => setShowCustomForm(true)}
                className="text-xs px-3 py-1 rounded border border-amber-600/50 bg-amber-600/10 text-amber-400 hover:bg-amber-600/20 transition"
              >
                + Custom Item
              </button>
            </div>
          )}
        </div>

        {archeotech.length === 0 && !showCustomForm && (
          <p className="text-sm text-slate-500 italic">No archeotech recorded.</p>
        )}

        {archeotech.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            editable={editable}
            onRemove={() => removeItem(item.id)}
          />
        ))}

        {showCustomForm && (
          <CustomItemForm
            onAdd={addCustom}
            onCancel={() => setShowCustomForm(false)}
          />
        )}
      </section>

      {/* ── MODAL ─────────────────────────────────────────────────────────── */}
      {showPicker && (
        <ArcheotechPickerModal
          onSelect={addFromRef}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
