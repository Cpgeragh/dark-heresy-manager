// src/pages/characterSheet/GearTab/index.tsx

import { useState, useCallback, useRef } from "react";
import type { TouchEvent } from "react";
import type { GearItem, ConsumableItem } from "../../../types/Character";
import type { GearRef } from "../../../data/reference/gearReference";
import type { ConsumableRef } from "../../../data/reference/consumablesReference";
import { ConsumableRow } from "./ConsumableRow";
import { ConsumablePicker } from "./ConsumablePicker";
import { ItemRow } from "./ItemRow";
import { GearPicker } from "./GearPicker";
import { CustomItemForm } from "./CustomItemForm";
import { CustomConsumableForm } from "./CustomConsumableForm";
import { SectionHeader } from "../../../ui/SectionHeader";
import { uiTextPlaceholder } from "../../../ui/editableStyles";
import { powerGroupActiveColour } from "../psychicStyles";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GearTabProps {
  gear: GearItem[];
  consumables: ConsumableItem[];
  editable: boolean;
  onUpdate: (next: GearItem[]) => void;
  onUpdateConsumables: (next: ConsumableItem[]) => void;
}

type GearSection = "items" | "consumables";

// ─── Component ────────────────────────────────────────────────────────────────

export function GearTab({ gear, consumables, editable, onUpdate, onUpdateConsumables }: GearTabProps) {
  const [showGearPicker, setShowGearPicker]               = useState(false);
  const [showCustomForm, setShowCustomForm]               = useState(false);
  const [showConsumablePicker, setShowConsumablePicker]   = useState(false);
  const [showCustomConsumableForm, setShowCustomConsumableForm] = useState(false);
  const [activeGearSection, setActiveGearSection]         = useState<GearSection>("items");
  const [gearTransition, setGearTransition]               = useState<"idle" | "sliding">("idle");
  const touchStartX = useRef<number | null>(null);

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

  const addCustomConsumable = useCallback(
    (item: ConsumableItem) => {
      if (!editable) return;
      onUpdateConsumables([...consumables, item]);
      setShowCustomConsumableForm(false);
      setActiveGearSection("consumables");
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
      setActiveGearSection("items");
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

  const switchGearSection = useCallback((section?: GearSection) => {
    setActiveGearSection((current) => {
      const next = section ?? (current === "items" ? "consumables" : "items");
      if (next === current) return current;
      setGearTransition("sliding");
      window.setTimeout(() => setGearTransition("idle"), 180);
      return next;
    });
  }, []);

  const handleGearTouchStart = useCallback((event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }, []);

  const handleGearTouchEnd = useCallback((event: TouchEvent<HTMLDivElement>) => {
    const startX = touchStartX.current;
    const endX = event.changedTouches[0]?.clientX;
    touchStartX.current = null;
    if (startX === null || endX === undefined) return;

    const deltaX = endX - startX;
    if (Math.abs(deltaX) < 50) return;
    switchGearSection();
  }, [switchGearSection]);

  const transitionClass =
    gearTransition === "sliding"
      ? activeGearSection === "items"
        ? "opacity-0 -translate-x-3"
        : "opacity-0 translate-x-3"
      : "opacity-100";
  const visibleGearSectionClass = (section: GearSection) =>
    [
      "space-y-3",
      activeGearSection === section
        ? `transition-all duration-150 ease-out motion-reduce:transition-none ${transitionClass}`
        : "hidden lg:block",
    ].join(" ");

  return (
    <div className="space-y-6" onTouchStart={handleGearTouchStart} onTouchEnd={handleGearTouchEnd}>
      <div className="lg:hidden">
        <div
          className="grid grid-cols-2 rounded-lg border border-slate-600 bg-slate-950/70 p-1"
          role="tablist"
          aria-label="Gear sections"
        >
          {(["items", "consumables"] as const).map((section) => {
            const active = activeGearSection === section;
            return (
              <button
                key={section}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => switchGearSection(section)}
                className={[
                  "rounded-md px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-semibold transition border",
                  active
                    ? powerGroupActiveColour(section === "items" ? "minor" : "major")
                    : "border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200",
                ].join(" ")}
              >
                {section === "items" ? "Items" : "Consumables"}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
      <section className={visibleGearSectionClass("items")} role="tabpanel">
        <div className="flex items-center justify-between">
          <SectionHeader>Items</SectionHeader>
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

        <div className="space-y-3">
          {gear.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              editable={editable}
              onRemove={() => removeItem(item.id)}
            />
          ))}
        </div>
      </section>
      {/* CONSUMABLES ──────────────────────────────────────────────────────── */}
      <section className={visibleGearSectionClass("consumables")} role="tabpanel">
        <div className="flex items-center justify-between">
          <SectionHeader>Consumables</SectionHeader>
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

        <div className="space-y-3">
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
      </section>
      </div>

      {showConsumablePicker && (
        <ConsumablePicker
          editable={editable}
          onSelect={addConsumableFromRef}
          onCustom={() => {
            setShowConsumablePicker(false);
            setShowCustomConsumableForm(true);
            setActiveGearSection("consumables");
          }}
          onClose={() => setShowConsumablePicker(false)}
        />
      )}

      {showCustomConsumableForm && (
        <CustomConsumableForm
          onAdd={addCustomConsumable}
          onCancel={() => setShowCustomConsumableForm(false)}
        />
      )}

      {showGearPicker && (
        <GearPicker
          editable={editable}
          onSelect={addFromRef}
          onCustom={() => {
            setShowGearPicker(false);
            setShowCustomForm(true);
            setActiveGearSection("items");
          }}
          onClose={() => setShowGearPicker(false)}
        />
      )}

      {showCustomForm && (
        <CustomItemForm
          onAdd={addCustom}
          onCancel={() => setShowCustomForm(false)}
        />
      )}
    </div>
  );
}
