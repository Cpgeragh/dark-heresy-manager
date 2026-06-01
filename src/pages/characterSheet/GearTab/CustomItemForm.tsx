// src/pages/characterSheet/GearTab/CustomItemForm.tsx

import { useState } from "react";
import type { GearItem } from "../../../types/Character";
import { editableInputClass, editableTextareaClass } from "../../../ui/editableStyles";

interface Props {
  onAdd: (item: GearItem) => void;
  onCancel: () => void;
}

export function CustomItemForm({ onAdd, onCancel }: Props) {
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
        <label className="text-xs text-slate-400">
          Description <span className="text-slate-600">(optional)</span>
        </label>
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
