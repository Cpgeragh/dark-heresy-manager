// src/pages/characterSheet/GearTab.tsx

import { useState, useCallback } from "react";
import type { GearItem } from "../../types/Character";
import { GEAR_REFERENCE, type GearRef } from "../../data/reference/gearReference";
import {
  editableInputClass,
  editableTextareaClass,
  sectionContainerClass,
} from "../../ui/editableStyles";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rarityColour(rarity: string | undefined): string {
  switch (rarity) {
    case "Plentiful":
    case "Abundant":
    case "Common":        return "text-slate-400";
    case "Average":       return "text-slate-300";
    case "Scarce":        return "text-yellow-400";
    case "Rare":          return "text-orange-400";
    case "Very Rare":     return "text-red-400";
    case "Extremely Rare":return "text-purple-400";
    case "Near Unique":   return "text-pink-400";
    default:              return "text-slate-400";
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface GearTabProps {
  gear: GearItem[];
  editable: boolean;
  onUpdate: (next: GearItem[]) => void;
}

// ─── Reference Picker ─────────────────────────────────────────────────────────

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
  );

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
          {(item.weight || item.value || item.rarity) && (
            <div className="flex flex-wrap gap-3 text-xs mt-1">
              {item.weight && <span className="text-slate-600">⚖ {item.weight}</span>}
              {item.value  && <span className="text-slate-600">₮ {item.value}</span>}
              {item.rarity && <span className={rarityColour(item.rarity)}>{item.rarity}</span>}
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

export function GearTab({ gear, editable, onUpdate }: GearTabProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);

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
        },
      ]);
      setShowPicker(false);
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

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Carried Items ({gear.length})
          </h3>
          {editable && !showCustomForm && (
            <button
              onClick={() => setShowPicker(true)}
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

      {showPicker && (
        <GearPicker
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
