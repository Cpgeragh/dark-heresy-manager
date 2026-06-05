// src/pages/characterSheet/GearTab/index.tsx

import { useState, useCallback } from "react";
import type { GearItem, ConsumableItem } from "../../../types/Character";
import type { GearRef } from "../../../data/reference/gearReference";
import type { ConsumableRef } from "../../../data/reference/consumablesReference";
import { ConsumableRow } from "./ConsumableRow";
import { ConsumablePicker } from "./ConsumablePicker";
import { ItemRow } from "./ItemRow";
import { GearPicker } from "./GearPicker";
import { CustomItemForm } from "./CustomItemForm";
import { uiSectionHeader } from "../../../ui/editableStyles";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GearTabProps {
  gear: GearItem[];
  consumables: ConsumableItem[];
  editable: boolean;
  onUpdate: (next: GearItem[]) => void;
  onUpdateConsumables: (next: ConsumableItem[]) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GearTab({ gear, consumables, editable, onUpdate, onUpdateConsumables }: GearTabProps) {
  const [showGearPicker, setShowGearPicker]               = useState(false);
  const [showCustomForm, setShowCustomForm]               = useState(false);
  const [showConsumablePicker, setShowConsumablePicker]   = useState(false);

  // ── Consumable handlers ──────────────────────────────────────────────────

  const addConsumableFromRef = useCallback(
    (ref: ConsumableRef) => {
      if (!editable) return;
      onUpdateConsumables([
        ...consumables,
        {
          id: crypto.randomUUID(),
          referenceId: ref.id,
          name: ref.name,
          quantity: 1,
          description: ref.description,
          weight: ref.weight,
          value: ref.value,
          rarity: ref.rarity,
          source: ref.source,
        },
      ]);
      setShowConsumablePicker(false);
    },
    [editable, consumables, onUpdateConsumables]
  );

  const updateConsumableQty = useCallback(
    (id: string, qty: number) => {
      if (!editable) return;
      onUpdateConsumables(
        consumables.map((c) => (c.id === id ? { ...c, quantity: qty } : c))
      );
    },
    [editable, consumables, onUpdateConsumables]
  );

  const removeConsumable = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdateConsumables(consumables.filter((c) => c.id !== id));
    },
    [editable, consumables, onUpdateConsumables]
  );

  // ── Gear handlers ────────────────────────────────────────────────────────

  const addFromRef = useCallback(
    (ref: GearRef) => {
      if (!editable) return;
      onUpdate([
        ...gear,
        {
          id: crypto.randomUUID(),
          referenceId: ref.id,
          name: ref.name,
          description: ref.description,
          weight: ref.weight,
          value: ref.value,
          rarity: ref.rarity,
          source: ref.source,
        },
      ]);
      setShowGearPicker(false);
    },
    [editable, gear, onUpdate]
  );

  const addCustom = useCallback(
    (item: GearItem) => {
      if (!editable) return;
      onUpdate([...gear, item]);
      setShowCustomForm(false);
    },
    [editable, gear, onUpdate]
  );

  const removeItem = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdate(gear.filter((g) => g.id !== id));
    },
    [editable, gear, onUpdate]
  );

  const updateItemValue = useCallback(
    (id: string, value: string) => {
      if (!editable) return;
      onUpdate(gear.map((g) => (g.id === id ? { ...g, value } : g)));
    },
    [editable, gear, onUpdate]
  );

  return (
    <div className="space-y-6">
      {/* CONSUMABLES ──────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className={uiSectionHeader}>
            Consumables ({consumables.length})
          </h3>
          <button
            onClick={() => setShowConsumablePicker(true)}
            className="text-xs px-3 py-1 rounded border border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700"
          >
            {editable ? "+ Add" : "View"}
          </button>
        </div>

        {consumables.length === 0 && (
          <p className="text-sm text-slate-500 italic">No consumables recorded.</p>
        )}

        {consumables.map((item) => (
          <ConsumableRow
            key={item.id}
            item={item}
            editable={editable}
            onUpdateQty={updateConsumableQty}
            onRemove={removeConsumable}
          />
        ))}
      </section>

      {/* GEAR ─────────────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className={uiSectionHeader}>
            Carried Items ({gear.length})
          </h3>
          {!showCustomForm && (
            <button
              onClick={() => setShowGearPicker(true)}
              className="text-xs px-3 py-1 rounded border border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700"
            >
              {editable ? "+ Add Item" : "View"}
            </button>
          )}
        </div>

        {gear.length === 0 && !showCustomForm && (
          <p className="text-sm text-slate-500 italic">No items recorded.</p>
        )}

        {gear.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            editable={editable}
            onUpdateValue={(value) => updateItemValue(item.id, value)}
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

      {/* MODALS ───────────────────────────────────────────────────────────── */}
      {showConsumablePicker && (
        <ConsumablePicker
          editable={editable}
          onSelect={addConsumableFromRef}
          onClose={() => setShowConsumablePicker(false)}
        />
      )}

      {showGearPicker && (
        <GearPicker
          editable={editable}
          onSelect={addFromRef}
          onCustom={() => {
            setShowGearPicker(false);
            setShowCustomForm(true);
          }}
          onClose={() => setShowGearPicker(false)}
        />
      )}
    </div>
  );
}
