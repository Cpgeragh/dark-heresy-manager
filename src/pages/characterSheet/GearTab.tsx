// src/pages/characterSheet/GearTab.tsx

import { useState, useCallback } from "react";
import type { GearItem, ConsumableItem } from "../../types/Character";
import { GEAR_REFERENCE, type GearRef } from "../../data/reference/gearReference";
import { CONSUMABLES_REFERENCE, type ConsumableRef } from "../../data/reference/consumablesReference";
import {
  editableInputClass,
  editableTextareaClass,
  sectionContainerClass,
} from "../../ui/editableStyles";
import { rarityColour, sourceColour } from "../../ui/sourceStyles";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GearTabProps {
  gear: GearItem[];
  consumables: ConsumableItem[];
  editable: boolean;
  onUpdate: (next: GearItem[]) => void;
  onUpdateConsumables: (next: ConsumableItem[]) => void;
}

// ─── Consumable Picker ────────────────────────────────────────────────────────

function ConsumablePicker({
  onSelect,
  onClose,
}: {
  onSelect: (ref: ConsumableRef) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = CONSUMABLES_REFERENCE.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-slate-200">Add Consumable</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-lg leading-none">×</button>
        </div>
        <div className="px-4 py-2 border-b border-slate-800">
          <input
            type="text"
            autoFocus
            placeholder="Search consumables…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={editableInputClass(true)}
          />
        </div>
        <div className="overflow-y-auto flex-1 divide-y divide-slate-800">
          {filtered.length === 0 && (
            <p className="p-4 text-sm text-slate-500 text-center">No matches.</p>
          )}
          {filtered.map((ref) => (
            <button
              key={ref.id}
              onClick={() => onSelect(ref)}
              className="w-full text-left px-4 py-3 hover:bg-slate-800 transition group"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-200 group-hover:text-white">
                  {ref.name}
                </p>
                <span className="text-xs shrink-0">
                  <span className="text-amber-400/80 font-mono">₮ {ref.value}</span>
                  <span className={`ml-2 ${rarityColour(ref.rarity)}`}>{ref.rarity}</span>
                </span>
              </div>
              {ref.description && (
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{ref.description}</p>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Consumable Row ───────────────────────────────────────────────────────────

function ConsumableRow({
  item,
  editable,
  onUpdateQty,
  onRemove,
}: {
  item: ConsumableItem;
  editable: boolean;
  onUpdateQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}) {
  const [editingQty, setEditingQty] = useState(false);
  const [qtyDraft, setQtyDraft]     = useState("");
  const [expanded, setExpanded]     = useState(false);

  const hasDesc = !!(item.description?.trim());

  function commitQty() {
    const n = parseInt(qtyDraft, 10);
    if (!isNaN(n) && n >= 0) onUpdateQty(item.id, n);
    setEditingQty(false);
  }

  return (
    <div className={sectionContainerClass(editable)}>
      <div className="flex items-start gap-3">
        {/* Quantity */}
        <div className="flex flex-col items-center shrink-0">
          <span className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Qty</span>
          <div className="flex items-center gap-1">
            {editable && (
              <button
                onClick={() => onUpdateQty(item.id, Math.max(0, item.quantity - 1))}
                className="w-5 h-5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs flex items-center justify-center leading-none"
              >
                −
              </button>
            )}
            {editable && editingQty ? (
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                value={qtyDraft}
                onChange={(e) => setQtyDraft(e.target.value.replace(/\D/g, ""))}
                onBlur={commitQty}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitQty();
                  if (e.key === "Escape") setEditingQty(false);
                }}
                className="w-8 text-center text-sm font-mono bg-slate-800 border border-amber-500 rounded px-1 py-0.5 text-slate-200 outline-none"
              />
            ) : (
              <span
                onClick={() => {
                  if (!editable) return;
                  setQtyDraft(String(item.quantity));
                  setEditingQty(true);
                }}
                title={editable ? "Click to edit" : undefined}
                className={`w-8 text-center text-sm font-mono font-semibold text-slate-200 ${editable ? "cursor-pointer underline decoration-dotted underline-offset-2 decoration-slate-600 hover:decoration-amber-500" : ""}`}
              >
                {item.quantity}
              </span>
            )}
            {editable && (
              <button
                onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                className="w-5 h-5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs flex items-center justify-center leading-none"
              >
                +
              </button>
            )}
          </div>
        </div>

        {/* Name + description + chips */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-200">{item.name}</p>
            {hasDesc && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="text-slate-500 hover:text-slate-300 text-xs transition"
              >
                {expanded ? "▲" : "▼"}
              </button>
            )}
          </div>
          {hasDesc && expanded && (
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.description}</p>
          )}
          {hasDesc && !expanded && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">{item.description}</p>
          )}
          <div className="flex flex-wrap gap-1.5 mt-1">
            <span className="text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-slate-400">
              ⚖ {item.weight ?? "—"}
            </span>
            {item.value && (
              <span className="text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-amber-400/80 font-mono">
                ₮ {item.value}
              </span>
            )}
            {item.rarity && (
              <span className={`text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 ${rarityColour(item.rarity)}`}>
                {item.rarity}
              </span>
            )}
            {item.source && (
              <span className={`text-xs rounded border bg-slate-800/40 px-1.5 py-0.5 font-mono ${sourceColour(item.source)}`}>
                {item.source}
              </span>
            )}
          </div>
        </div>

        {editable && (
          <button
            onClick={() => onRemove(item.id)}
            className="text-xs text-red-400 hover:text-red-300 transition shrink-0"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Gear Picker ──────────────────────────────────────────────────────────────

function GearPicker({
  onSelect,
  onCustom,
  onClose,
}: {
  onSelect: (ref: GearRef) => void;
  onCustom: () => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = GEAR_REFERENCE.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-slate-200">Add Item</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-lg leading-none"
          >
            ×
          </button>
        </div>
        <div className="px-4 py-2 border-b border-slate-800">
          <input
            type="text"
            autoFocus
            placeholder="Search gear…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={editableInputClass(true)}
          />
        </div>
        <div className="overflow-y-auto flex-1 divide-y divide-slate-800">
          {filtered.length === 0 && (
            <p className="p-4 text-sm text-slate-500 text-center">No matches.</p>
          )}
          {filtered.map((ref) => (
            <button
              key={ref.id}
              onClick={() => onSelect(ref)}
              className="w-full text-left px-4 py-3 hover:bg-slate-800 transition group"
            >
              <p className="text-sm font-medium text-slate-200 group-hover:text-white">
                {ref.name}
              </p>
              {ref.description && (
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                  {ref.description}
                </p>
              )}
            </button>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-slate-700">
          <button
            onClick={onCustom}
            className="w-full text-sm text-amber-400 hover:text-amber-300 text-center py-1"
          >
            + Add custom item
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Custom Item Form ─────────────────────────────────────────────────────────

function CustomItemForm({
  onAdd,
  onCancel,
}: {
  onAdd: (item: GearItem) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="border border-amber-500/30 bg-slate-900/60 rounded-lg p-4 space-y-3">
      <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Custom Item</p>
      <div className="space-y-1">
        <label className="text-xs text-slate-400">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Item name…"
          className={editableInputClass(true)}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-slate-400">Description <span className="text-slate-600">(optional)</span></label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Notes, properties, weight, craftsmanship…"
          rows={3}
          className={editableTextareaClass(true)}
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={() =>
            onAdd({
              id: crypto.randomUUID(),
              name: name.trim(),
              description: description.trim() || undefined,
            })
          }
          disabled={!name.trim()}
          className="flex-1 py-1.5 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-sm text-slate-900 font-semibold"
        >
          Add
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-1.5 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 text-sm text-slate-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Item Row ─────────────────────────────────────────────────────────────────

function ItemRow({
  item,
  editable,
  onRemove,
}: {
  item: GearItem;
  editable: boolean;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasDesc = !!(item.description?.trim());

  // Fall back to reference data for items saved before weight/value/rarity were stored
  const ref = item.referenceId
    ? GEAR_REFERENCE.find((r) => r.id === item.referenceId)
    : undefined;
  const weight = item.weight ?? ref?.weight;
  const value  = item.value  ?? ref?.value;
  const rarity = item.rarity ?? ref?.rarity;

  return (
    <div className={sectionContainerClass(editable)}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-200">{item.name}</p>
            {hasDesc && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="text-slate-500 hover:text-slate-300 text-xs transition"
              >
                {expanded ? "▲" : "▼"}
              </button>
            )}
          </div>
          {!hasDesc && (
            <p className="text-xs text-slate-600 italic">No description.</p>
          )}
          {hasDesc && expanded && (
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {item.description}
            </p>
          )}
          {hasDesc && !expanded && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">{item.description}</p>
          )}
          {(weight || value || rarity || item.source) && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {weight && <span className="text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-slate-400">⚖ {weight}</span>}
              {value  && <span className="text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-slate-400">₮ {value}</span>}
              {rarity && <span className={`text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 ${rarityColour(rarity)}`}>{rarity}</span>}
              {item.source && <span className={`text-xs rounded border bg-slate-800/40 px-1.5 py-0.5 font-mono ${sourceColour(item.source)}`}>{item.source}</span>}
            </div>
          )}
        </div>

        {editable && (
          <button
            onClick={onRemove}
            className="text-xs text-red-400 hover:text-red-300 transition shrink-0"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function GearTab({ gear, consumables, editable, onUpdate, onUpdateConsumables }: GearTabProps) {
  const [showGearPicker, setShowGearPicker]           = useState(false);
  const [showCustomForm, setShowCustomForm]           = useState(false);
  const [showConsumablePicker, setShowConsumablePicker] = useState(false);

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

  return (
    <div className="space-y-6 text-slate-300">
      <h2 className="text-xl font-semibold">Gear &amp; Equipment</h2>

      {/* CONSUMABLES ──────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Consumables ({consumables.length})
          </h3>
          {editable && (
            <button
              onClick={() => setShowConsumablePicker(true)}
              className="text-xs px-3 py-1 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700"
            >
              + Add
            </button>
          )}
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
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Carried Items ({gear.length})
          </h3>
          {editable && !showCustomForm && (
            <button
              onClick={() => setShowGearPicker(true)}
              className="text-xs px-3 py-1 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700"
            >
              + Add Item
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
          onSelect={addConsumableFromRef}
          onClose={() => setShowConsumablePicker(false)}
        />
      )}

      {showGearPicker && (
        <GearPicker
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
