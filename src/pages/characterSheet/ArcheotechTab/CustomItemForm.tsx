// src/pages/characterSheet/ArcheotechTab/CustomItemForm.tsx

import { useState } from "react";
import type { ArcheotechItem } from "../../../types/Character";
import { editableInputClass, editableTextareaClass } from "../../../ui/editableStyles";
import { ITEM_TYPES, RARITY_OPTIONS, type ItemType } from "./archeotechConstants";

interface Props {
  onAdd: (item: ArcheotechItem) => void;
  onCancel: () => void;
}

export function CustomItemForm({ onAdd, onCancel }: Props) {
  const [name,        setName]        = useState("");
  const [type,        setType]        = useState<ItemType | "">("");
  const [description, setDescription] = useState("");
  const [notes,       setNotes]       = useState("");
  const [weight,      setWeight]      = useState("");
  const [value,       setValue]       = useState("");
  const [rarity,      setRarity]      = useState("");

  const canAdd = name.trim().length > 0;

  function handleAdd() {
    if (!canAdd) return;
    onAdd({
      id:          crypto.randomUUID(),
      name:        name.trim(),
      type:        type || undefined,
      description: description.trim() || undefined,
      notes:       notes.trim() || undefined,
      weight:      weight.trim() || undefined,
      value:       value.trim() || undefined,
      rarity:      rarity || undefined,
    });
  }

  return (
    <div className="border border-amber-500/30 bg-slate-900/60 rounded-lg p-4 space-y-3">
      <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
        Custom Archeotech Item
      </p>

      {/* Name */}
      <div className="space-y-1">
        <label className="text-xs text-slate-400">Name <span className="text-red-400">*</span></label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Item name…"
          className={editableInputClass(true)}
          autoFocus
        />
      </div>

      {/* Type */}
      <div className="space-y-1">
        <label className="text-xs text-slate-400">Type <span className="text-slate-600">(optional)</span></label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ItemType | "")}
          className={editableInputClass(true) + " appearance-none"}
        >
          <option value="">— Select type —</option>
          {ITEM_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Weight + Value on one row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-slate-400">Weight <span className="text-slate-600">(optional)</span></label>
          <input
            type="text"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g. 2 kg"
            className={editableInputClass(true)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-400">Value <span className="text-slate-600">(optional)</span></label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. Priceless"
            className={editableInputClass(true)}
          />
        </div>
      </div>

      {/* Rarity */}
      <div className="space-y-1">
        <label className="text-xs text-slate-400">Rarity <span className="text-slate-600">(optional)</span></label>
        <select
          value={rarity}
          onChange={(e) => setRarity(e.target.value)}
          className={editableInputClass(true) + " appearance-none"}
        >
          <option value="">— Select rarity —</option>
          {RARITY_OPTIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label className="text-xs text-slate-400">
          Description / Rules <span className="text-slate-600">(optional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Rules text, special properties…"
          rows={3}
          className={editableTextareaClass(true)}
        />
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <label className="text-xs text-slate-400">
          Notes <span className="text-slate-600">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Personal notes, where it was found…"
          rows={2}
          className={editableTextareaClass(true)}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleAdd}
          disabled={!canAdd}
          className="flex-1 py-1.5 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm text-slate-900 font-semibold transition"
        >
          Add Item
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-1.5 rounded border border-slate-500 bg-slate-800 hover:bg-slate-700 text-sm text-slate-100 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
