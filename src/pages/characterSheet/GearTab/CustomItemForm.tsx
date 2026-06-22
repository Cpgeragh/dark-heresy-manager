// src/pages/characterSheet/GearTab/CustomItemForm.tsx

import { useState } from "react";
import type { GearItem } from "../../../types/Character";
import { editableInputClass, editableTextareaClass } from "../../../ui/editableStyles";
import { Button } from "../../../ui/Button";
import { formatWeightInput, sanitizeWeightInput } from "../../../ui/weightFormat";
import { formatMoneyInput, sanitizeMoneyInput } from "../../../ui/moneyFormat";

interface Props {
  onAdd: (item: GearItem) => void;
  onCancel: () => void;
}

export function CustomItemForm({ onAdd, onCancel }: Props) {
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="border border-red-700/30 bg-slate-900/60 rounded-lg p-4 lg:p-5 space-y-3">
      <p className="text-xs lg:text-sm font-semibold text-red-500 uppercase tracking-wide">Custom Item</p>
      <div className="space-y-1">
        <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Item name…"
          className={editableInputClass(true)}
        />
      </div>
      <div className="flex items-center gap-3">
        <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100 w-14 lg:w-20 shrink-0">
          Weight
        </label>
        <input
          type="text"
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(sanitizeWeightInput(e.target.value))}
          placeholder="0"
          className={editableInputClass(true) + " w-20 font-code"}
        />
        <span className="text-xs lg:text-sm text-slate-400">kg</span>
      </div>
      <div className="flex items-center gap-3">
        <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100 w-14 lg:w-20 shrink-0">
          Cost
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(sanitizeMoneyInput(e.target.value))}
          placeholder="0"
          className={editableInputClass(true) + " w-24 font-code"}
        />
        <span className="text-xs lg:text-sm text-slate-400">Thrones</span>
      </div>
      <div className="space-y-1">
        <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
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
        <Button
          className="flex-1"
          onClick={() =>
            onAdd({
              id: crypto.randomUUID(),
              name: name.trim(),
              weight: formatWeightInput(weight),
              value: formatMoneyInput(value),
              description: description.trim() || undefined,
            })
          }
          disabled={!name.trim()}
        >
          Add
        </Button>
        <button
          onClick={onCancel}
          className="px-4 lg:px-5 py-1.5 lg:py-2 rounded border border-slate-500 bg-slate-800 hover:bg-slate-700 text-sm lg:text-base text-slate-100"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
