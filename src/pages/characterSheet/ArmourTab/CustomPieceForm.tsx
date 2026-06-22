// src/pages/characterSheet/ArmourTab/CustomPieceForm.tsx

import { useState } from "react";
import type { ArmourLocationKey, WornArmourPiece } from "../../../types/Character";
import { editableInputClass } from "../../../ui/editableStyles";
import { Button } from "../../../ui/Button";
import { formatWeightInput, sanitizeWeightInput } from "../../../ui/weightFormat";
import { formatMoneyInput, sanitizeMoneyInput } from "../../../ui/moneyFormat";
import { LOCATION_LABELS, LOCATION_ORDER } from "./armourHelpers";

interface Props {
  onAdd: (piece: WornArmourPiece) => void;
  onCancel: () => void;
}

/** Inline form for adding a fully custom piece */
export function CustomPieceForm({ onAdd, onCancel }: Props) {
  const [name, setName] = useState("");
  const [ap, setAp] = useState("");
  const [weight, setWeight] = useState("");
  const [value, setValue] = useState("");
  const [selectedLocs, setSelectedLocs] = useState<Set<ArmourLocationKey>>(new Set());

  function toggleLoc(loc: ArmourLocationKey) {
    setSelectedLocs((prev) => {
      const next = new Set(prev);
      if (next.has(loc)) next.delete(loc);
      else next.add(loc);
      return next;
    });
  }

  function handleAdd() {
    if (!name.trim() || selectedLocs.size === 0) return;
    const piece: WornArmourPiece = {
      id: crypto.randomUUID(),
      name: name.trim(),
      locations: [...selectedLocs],
      ap: Number(ap) || 0,
      worn: true,
      custom: true,
    };
    piece.weight = formatWeightInput(weight);
    piece.value = formatMoneyInput(value);
    onAdd(piece);
  }

  return (
    <div className="border border-red-700/30 bg-slate-900/60 rounded-lg p-4 lg:p-5 space-y-3">
      <p className="text-xs lg:text-sm font-semibold text-red-500 uppercase tracking-wide">Custom Piece</p>

      <div className="space-y-1">
        <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Flak Jacket"
          className={editableInputClass(true)}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
          Locations covered
        </label>
        <div className="flex flex-wrap gap-2">
          {LOCATION_ORDER.map((loc) => (
            <button
              key={loc}
              onClick={() => toggleLoc(loc)}
              className={[
                "text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-1.5 rounded border transition",
                selectedLocs.has(loc)
                  ? "border-red-600 bg-red-600/20 text-red-400"
                  : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500",
              ].join(" ")}
            >
              {LOCATION_LABELS[loc]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100 w-14 lg:w-20 shrink-0">
          AP
        </label>
        <input
          type="number"
          min={0}
          max={20}
          value={ap}
          onChange={(e) => setAp(e.target.value)}
          placeholder="0"
          className={editableInputClass(true) + " w-20 font-code"}
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

      <div className="flex gap-2 pt-1">
        <Button
          className="flex-1"
          onClick={handleAdd}
          disabled={!name.trim() || selectedLocs.size === 0}
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
