// src/pages/characterSheet/ArmourTab/CustomPieceForm.tsx

import { useState } from "react";
import type { ArmourLocationKey, WornArmourPiece } from "../../../types/Character";
import { editableInputClass } from "../../../ui/editableStyles";
import { Button } from "../../../ui/Button";
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
    const kg = Number(weight.trim());
    if (weight.trim() && !Number.isNaN(kg)) piece.weight = `${kg} kg`;
    onAdd(piece);
  }

  return (
    <div className="border border-amber-500/30 bg-slate-900/60 rounded-lg p-4 space-y-3">
      <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Custom Piece</p>

      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-slate-100">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Flak Jacket"
          className={editableInputClass(true)}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-slate-100">
          Locations covered
        </label>
        <div className="flex flex-wrap gap-2">
          {LOCATION_ORDER.map((loc) => (
            <button
              key={loc}
              onClick={() => toggleLoc(loc)}
              className={[
                "text-xs px-2 py-1 rounded border transition",
                selectedLocs.has(loc)
                  ? "border-amber-500 bg-amber-500/20 text-amber-300"
                  : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500",
              ].join(" ")}
            >
              {LOCATION_LABELS[loc]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-xs font-medium uppercase tracking-wide text-slate-100 w-14 shrink-0">
          AP
        </label>
        <input
          type="number"
          min={0}
          max={20}
          value={ap}
          onChange={(e) => setAp(e.target.value)}
          placeholder="0"
          className={editableInputClass(true) + " w-20 font-mono"}
        />
      </div>

      <div className="flex items-center gap-3">
        <label className="text-xs font-medium uppercase tracking-wide text-slate-100 w-14 shrink-0">
          Weight
        </label>
        <input
          type="text"
          inputMode="decimal"
          value={weight}
          onChange={(e) => {
            let v = e.target.value.replace(/[^\d.]/g, "");
            const parts = v.split(".");
            if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
            setWeight(v);
          }}
          placeholder="0"
          className={editableInputClass(true) + " w-20 font-mono"}
        />
        <span className="text-xs text-slate-400">kg</span>
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
          className="px-4 py-1.5 rounded border border-slate-500 bg-slate-800 hover:bg-slate-700 text-sm text-slate-100"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
