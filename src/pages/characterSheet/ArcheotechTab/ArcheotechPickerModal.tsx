// src/pages/characterSheet/ArcheotechTab/ArcheotechPickerModal.tsx

import { useState, useMemo } from "react";
import {
  ARCHEOTECH_REFERENCE,
  type ArcheotechRef,
} from "../../../data/reference/archeotechReference";
import { editableInputClass } from "../../../ui/editableStyles";
import { rarityColour, sourceColour } from "../../../ui/sourceStyles";
import { RARITY_OPTIONS } from "./archeotechConstants";
import { PickerModal } from "../../../ui/PickerModal";

interface Props {
  onSelect: (ref: ArcheotechRef, gmValue?: string, gmRarity?: string) => void;
  onClose: () => void;
}

export function ArcheotechPickerModal({ onSelect, onClose }: Props) {
  const [query,    setQuery]    = useState("");
  const [pending,  setPending]  = useState<ArcheotechRef | null>(null);
  const [gmCost,   setGmCost]   = useState("");
  const [gmRarity, setGmRarity] = useState("");

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return [...ARCHEOTECH_REFERENCE]
      .filter((r) =>
        !normalizedQuery ||
        r.name.toLowerCase().includes(normalizedQuery) ||
        r.type.toLowerCase().includes(normalizedQuery)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [query]);

  const needsGmInput = (ref: ArcheotechRef) => ref.value === "—" || ref.rarity === "—";

  function handleRowClick(ref: ArcheotechRef) {
    if (needsGmInput(ref)) {
      setPending(ref);
      setGmCost("");
      setGmRarity("");
    } else {
      onSelect(ref);
    }
  }

  const costNum    = Number(gmCost);
  const costValid  = gmCost.trim() !== "" && Number.isInteger(costNum) && costNum >= 1;
  const canConfirm = costValid && gmRarity !== "";

  function handleConfirm() {
    if (!pending || !canConfirm) return;
    onSelect(pending, `${gmCost} Thrones`, gmRarity);
  }

  return (
    <PickerModal
      title={pending ? "GM-Assigned Values" : "Add Known Archeotech"}
      placeholder="Search archeotech…"
      query={query}
      onQueryChange={setQuery}
      onClose={pending ? () => setPending(null) : onClose}
      closeLabel={pending ? "←" : "×"}
      isEmpty={!pending && filtered.length === 0}
      hideSearch={!!pending}
    >
      {pending ? (
        // ── Step 2: GM form ──────────────────────────────────────────────────
        <div className="p-4 space-y-4">
          <p className="text-sm text-slate-400">
            <span className="font-medium text-slate-200">{pending.name}</span> has no
            standard cost or availability. Enter the values the GM has assigned.
          </p>

          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-100">
              Cost (Thrones) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              min={1}
              step={1}
              value={gmCost}
              onChange={(e) => setGmCost(e.target.value)}
              placeholder="e.g. 5000"
              className={editableInputClass(true)}
            />
            {gmCost.trim() !== "" && !costValid && (
              <p className="text-xs text-red-400">Must be a whole number of 1 or more.</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-100">
              Rarity <span className="text-red-400">*</span>
            </label>
            <select
              value={gmRarity}
              onChange={(e) => setGmRarity(e.target.value)}
              className={editableInputClass(true) + " appearance-none"}
            >
              <option value="">— Select rarity —</option>
              {RARITY_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setPending(null)}
              className="px-4 py-1.5 rounded border border-slate-500 bg-slate-800 hover:bg-slate-700 text-sm text-slate-100 transition"
            >
              Back
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="flex-1 py-1.5 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm text-slate-900 font-semibold transition"
            >
              Add to Inventory
            </button>
          </div>
        </div>
      ) : (
        // ── Step 1: Search list ──────────────────────────────────────────────
        filtered.map((ref) => (
          <button
            key={ref.id}
            onClick={() => handleRowClick(ref)}
            className="w-full text-left px-4 py-3 hover:bg-slate-800 transition group"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-200 group-hover:text-white">
                {ref.name}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-500">{ref.type}</span>
                <span className={`text-xs rounded border bg-slate-800/40 px-1.5 py-0.5 font-mono ${sourceColour(ref.source)}`}>
                  {ref.source}
                </span>
              </div>
            </div>
            {ref.rarity && ref.rarity !== "—" && (
              <p className={`text-xs mt-0.5 ${rarityColour(ref.rarity)}`}>{ref.rarity}</p>
            )}
            {ref.rarity === "—" && (
              <p className="text-xs mt-0.5 text-amber-400/70 italic">GM determines cost &amp; rarity</p>
            )}
            {ref.description && (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{ref.description}</p>
            )}
          </button>
        ))
      )}
    </PickerModal>
  );
}
