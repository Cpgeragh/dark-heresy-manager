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
import { SectionHeader } from "../../../ui/SectionHeader";
import { uiTextPlaceholder } from "../../../ui/editableStyles";

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
          availability: ref.availability,
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
    (ref: GearRef, gmValue?: string, gmRarity?: string) => {
      if (!editable) return;
      onUpdate([
        ...gear,
        {
          id: crypto.randomUUID(),
          referenceId: ref.id,
          name: ref.name,
          description: ref.description,
          weight: ref.weight,
          value: gmValue ?? ref.value,
          availability: gmRarity ?? ref.availability,
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

  const consumableColumns = [
    consumables.filter((_, index) => index % 2 === 0),
    consumables.filter((_, index) => index % 2 === 1),
  ];

  const gearColumns = [
    gear.filter((_, index) => index % 2 === 0),
    gear.filter((_, index) => index % 2 === 1),
  ];

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionHeader>Items ({gear.length})</SectionHeader>
          {!showCustomForm && (
            <button
              onClick={() => setShowGearPicker(true)}
              className="text-xs lg:text-sm px-3 lg:px-4 py-1 lg:py-1.5 rounded border border-red-500 text-red-500 font-semibold hover:bg-red-500/10 transition"
            >
              {editable ? "+ Add" : "View"}
            </button>
          )}
        </div>

        {gear.length === 0 && !showCustomForm && (
          <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No items recorded.</p>
        )}

        <div className="space-y-3 sm:hidden">
          {gear.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              editable={editable}
              onRemove={() => removeItem(item.id)}
            />
          ))}
        </div>

        <div className="hidden sm:grid sm:grid-cols-2 sm:gap-3 sm:items-start">
          {gearColumns.map((column, index) => (
            <div key={index} className="space-y-3">
              {column.map((item) => (
                <ItemRow
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
          <CustomItemForm
            onAdd={addCustom}
            onCancel={() => setShowCustomForm(false)}
          />
        )}
      </section>
      {/* CONSUMABLES ──────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionHeader>Consumables ({consumables.length})</SectionHeader>
          <button
            onClick={() => setShowConsumablePicker(true)}
            className="text-xs lg:text-sm px-3 lg:px-4 py-1 lg:py-1.5 rounded border border-red-500 text-red-500 font-semibold hover:bg-red-500/10 transition"
          >
            {editable ? "+ Add" : "View"}
          </button>
        </div>

        {consumables.length === 0 && (
          <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No consumables recorded.</p>
        )}

        <div className="space-y-3 sm:hidden">
          {consumables.map((item) => (
            <ConsumableRow
              key={item.id}
              item={item}
              editable={editable}
              onUpdateQty={updateConsumableQty}
              onRemove={removeConsumable}
            />
          ))}
        </div>

        <div className="hidden sm:grid sm:grid-cols-2 sm:gap-3 sm:items-start">
          {consumableColumns.map((column, index) => (
            <div key={index} className="space-y-3">
              {column.map((item) => (
                <ConsumableRow
                  key={item.id}
                  item={item}
                  editable={editable}
                  onUpdateQty={updateConsumableQty}
                  onRemove={removeConsumable}
                />
              ))}
            </div>
          ))}
        </div>
      </section>

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
