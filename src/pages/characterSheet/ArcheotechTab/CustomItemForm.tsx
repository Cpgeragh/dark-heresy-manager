// src/pages/characterSheet/ArcheotechTab/CustomItemForm.tsx

import { useState } from "react";
import type { ArcheotechItem } from "../../../types/Character";
import { editableInputClass, editableTextareaClass } from "../../../ui/editableStyles";
import { Button } from "../../../ui/Button";
import { formatWeightInput, sanitizeWeightInput } from "../../../ui/weightFormat";
import { formatMoneyInput, sanitizeMoneyInput } from "../../../ui/moneyFormat";
import { ITEM_TYPES, RARITY_OPTIONS, type ItemType } from "./archeotechConstants";

interface Props {
  onAdd: (item: ArcheotechItem) => void;
  onCancel: () => void;
}

export function CustomItemForm({ onAdd, onCancel }: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState<ItemType | "">("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [weight, setWeight] = useState("");
  const [value, setValue] = useState("");
  const [rarity, setRarity] = useState("");

  const formattedWeight = formatWeightInput(weight);
  const formattedValue = formatMoneyInput(value);
  const canAdd = name.trim().length > 0;

  function handleWeightChange(value: string) {
    setWeight(sanitizeWeightInput(value));
  }

  function handleValueChange(value: string) {
    setValue(sanitizeMoneyInput(value));
  }

  function handleAdd() {
    if (!canAdd) return;
    onAdd({
      id: crypto.randomUUID(),
      name: name.trim(),
      type: type || undefined,
      description: description.trim() || undefined,
      notes: notes.trim() || undefined,
      weight: formattedWeight,
      value: formattedValue,
      rarity: rarity || undefined,
    });
  }

  return (
    <div className="border border-red-700/30 bg-slate-900/60 rounded-lg p-4 lg:p-5 space-y-3">
      <p className="text-xs lg:text-sm font-semibold text-red-500 uppercase tracking-wide">
        Custom Archeotech Item
      </p>

      {/* Name */}
      <div className="space-y-1">
        <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
          Name <span className="text-red-400">*</span>
        </label>
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
        <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
          Type <span className="text-slate-600">(optional)</span>
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ItemType | "")}
          className={editableInputClass(true) + " appearance-none"}
        >
          <option value="">— Select type —</option>
          {ITEM_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Weight + Value on one row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
            Weight
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={weight}
            onChange={(e) => handleWeightChange(e.target.value)}
            placeholder="e.g. 2"
            className={editableInputClass(true)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
            Value <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={value}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder="e.g. 1000"
            className={editableInputClass(true)}
          />
        </div>
      </div>

      {/* Rarity */}
      <div className="space-y-1">
        <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
          Rarity <span className="text-slate-600">(optional)</span>
        </label>
        <select
          value={rarity}
          onChange={(e) => setRarity(e.target.value)}
          className={editableInputClass(true) + " appearance-none"}
        >
          <option value="">— Select rarity —</option>
          {RARITY_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
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
        <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
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
        <Button className="flex-1" onClick={handleAdd} disabled={!canAdd}>
          Add Item
        </Button>
        <button
          onClick={onCancel}
          className="px-4 lg:px-5 py-1.5 lg:py-2 rounded border border-slate-500 bg-slate-800 hover:bg-slate-700 text-sm lg:text-base text-slate-100 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
