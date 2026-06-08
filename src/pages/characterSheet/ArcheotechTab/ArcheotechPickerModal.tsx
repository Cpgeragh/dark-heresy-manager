// src/pages/characterSheet/ArcheotechTab/ArcheotechPickerModal.tsx

import { useState, useMemo } from "react";
import {
  ARCHEOTECH_REFERENCE,
  type ArcheotechRef,
} from "../../../data/reference/archeotechReference";
import { editableInputClass } from "../../../ui/editableStyles";
import { RARITY_OPTIONS } from "./archeotechConstants";
import { PickerModal } from "../../../ui/PickerModal";
import { InfoModal } from "../../../components/InfoModal";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";

interface Props {
  editable?: boolean;
  onSelect: (ref: ArcheotechRef, gmValue?: string, gmRarity?: string) => void;
  onClose: () => void;
}

export function ArcheotechPickerModal({ editable = true, onSelect, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<ArcheotechRef | null>(null);
  const [gmCost, setGmCost] = useState("");
  const [gmRarity, setGmRarity] = useState("");

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return [...ARCHEOTECH_REFERENCE]
      .filter(
        (r) =>
          !normalizedQuery ||
          r.name.toLowerCase().includes(normalizedQuery) ||
          r.type.toLowerCase().includes(normalizedQuery)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [query]);

  const isUnknownMeta = (value?: string) => !value || value.trim() === "—";
  const needsGmInput = (ref: ArcheotechRef) => isUnknownMeta(ref.value) || isUnknownMeta(ref.rarity);

  function handleRowClick(ref: ArcheotechRef) {
    if (!editable) return;
    if (needsGmInput(ref)) {
      setPending(ref);
      setGmCost("");
      setGmRarity("");
    } else {
      onSelect(ref);
    }
  }

  const costNum = Number(gmCost);
  const costValid = gmCost.trim() !== "" && Number.isInteger(costNum) && costNum >= 1;
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
            <span className="font-medium text-slate-200">{pending.name}</span> has no standard cost
            or availability. Enter the values the GM has assigned.
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
                <option key={r} value={r}>
                  {r}
                </option>
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
            onClick={editable ? () => handleRowClick(ref) : undefined}
            className={`w-full text-left px-4 py-3 transition group ${editable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"}`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={`text-sm font-medium text-slate-200 truncate ${editable ? "group-hover:text-white" : ""}`}
              >
                {ref.name}
              </span>
              {ref.description && (
                <span className="inline-flex items-center leading-[0]" onClick={(e) => e.stopPropagation()}>
                  <InfoModal
                    title={ref.name}
                    content={<p className="text-sm text-slate-300 leading-relaxed">{ref.description}</p>}
                  />
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs mt-0.5 flex-wrap">
              <span className="text-slate-500">{ref.type}</span>
              <ItemMetaChips
                bare
                weight={ref.weight}
                value={isUnknownMeta(ref.value) ? undefined : ref.value}
                rarity={isUnknownMeta(ref.rarity) ? undefined : ref.rarity}
                source={ref.source}
                valueAmber
              />
              {needsGmInput(ref) && (
                <span className="text-amber-400/70 italic">GM determines cost &amp; rarity</span>
              )}
            </div>
          </button>
        ))
      )}
    </PickerModal>
  );
}
