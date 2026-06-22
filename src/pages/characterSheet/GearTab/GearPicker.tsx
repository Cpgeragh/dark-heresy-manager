// src/pages/characterSheet/GearTab/GearPicker.tsx

import { useState } from "react";
import { InfoModal } from "../../../components/InfoModal";
import { GEAR_REFERENCE, type GearRef } from "../../../data/reference/gearReference";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { PickerModal } from "../../../ui/PickerModal";
import { Button } from "../../../ui/Button";
import { editableInputClass, uiTextBody } from "../../../ui/editableStyles";
import { formatMoneyInput, sanitizeMoneyInput } from "../../../ui/moneyFormat";

interface Props {
  editable?: boolean;
  onSelect: (ref: GearRef, gmValue?: string, gmRarity?: string) => void;
  onCustom: () => void;
  onClose: () => void;
}

const AVAILABILITY_OPTIONS = [
  "Abundant",
  "Plentiful",
  "Common",
  "Average",
  "Uncommon",
  "Scarce",
  "Rare",
  "Very Rare",
  "Extremely Rare",
  "Near Unique",
  "Unique",
  "Issued Only",
  "Adeptus Mechanicus Only",
] as const;

function isVariableMeta(value?: string | null) {
  const normalized = value?.trim().toLowerCase();
  return !normalized || normalized === "\u2014" || normalized === "variable" || normalized === "varies";
}

export function GearPicker({ editable = true, onSelect, onCustom, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<GearRef | null>(null);
  const [gmCost, setGmCost] = useState("");
  const [gmRarity, setGmRarity] = useState("");
  const filtered = GEAR_REFERENCE.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));
  const pendingNeedsRarity = pending ? isVariableMeta(pending.availability) : false;
  const costNum = Number(gmCost);
  const costValid = gmCost.trim() !== "" && Number.isInteger(costNum) && costNum >= 0;
  const canConfirm = costValid && (!pendingNeedsRarity || gmRarity !== "");

  function handleSelect(ref: GearRef) {
    if (!editable) return;
    if (isVariableMeta(ref.value)) {
      setPending(ref);
      setGmCost("");
      setGmRarity("");
      return;
    }
    onSelect(ref);
  }

  function handleConfirm() {
    if (!pending || !canConfirm) return;
    onSelect(pending, formatMoneyInput(gmCost), pendingNeedsRarity ? gmRarity : undefined);
  }

  return (
    <PickerModal
      title={pending ? "Assigned Cost" : editable ? "Add Item" : "View Items"}
      placeholder="Search gear…"
      query={query}
      onQueryChange={setQuery}
      onClose={pending ? () => setPending(null) : onClose}
      closeLabel={pending ? "←" : "×"}
      hideSearch={!!pending}
      isEmpty={!pending && filtered.length === 0}
      filterRow={
        !pending && editable ? (
          <button
            onClick={onCustom}
            className="w-full text-xs lg:text-sm px-3 lg:px-4 py-1.5 lg:py-2 rounded border border-red-700/50 bg-red-700/10 text-red-500 hover:bg-red-700/20 transition text-center"
          >
            + Custom Item
          </button>
        ) : undefined
      }
    >
      {pending ? (
        <div className="p-4 lg:p-5 space-y-4">
          <p className={`text-sm lg:text-base ${uiTextBody}`}>
            <span className="font-medium text-slate-200">{pending.name}</span> has a variable or
            unlisted cost. Enter the value assigned for this item.
          </p>

          <div className="space-y-1">
            <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
              Cost (Thrones) <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={gmCost}
              onChange={(e) => setGmCost(sanitizeMoneyInput(e.target.value))}
              placeholder="e.g. 500"
              className={editableInputClass(true)}
            />
            {gmCost.trim() !== "" && !costValid && (
              <p className="text-xs lg:text-sm text-red-400">Must be a whole number of 0 or more.</p>
            )}
          </div>

          {pendingNeedsRarity && (
            <div className="space-y-1">
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                Rarity <span className="text-red-400">*</span>
              </label>
              <select
                value={gmRarity}
                onChange={(e) => setGmRarity(e.target.value)}
                className={editableInputClass(true) + " appearance-none"}
              >
                <option value="">— Select availability —</option>
                {AVAILABILITY_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setPending(null)}
              className="px-4 lg:px-5 py-1.5 lg:py-2 rounded border border-slate-500 bg-slate-800 hover:bg-slate-700 text-sm lg:text-base text-slate-100 transition"
            >
              Back
            </button>
            <Button className="flex-1" onClick={handleConfirm} disabled={!canConfirm}>
              Add to Inventory
            </Button>
          </div>
        </div>
      ) : (
        filtered.map((ref) => (
        <div
          key={ref.id}
          role="button"
          tabIndex={editable ? 0 : -1}
          onClick={editable ? () => handleSelect(ref) : undefined}
          className={`w-full text-left px-4 lg:px-5 py-3 lg:py-4 transition group ${editable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"}`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className={`text-sm lg:text-base font-medium text-slate-200 truncate ${editable ? "group-hover:text-white" : ""}`}>
                {ref.name}
              </span>
              {ref.description && (
                <span className="inline-flex items-center -translate-y-[1.4px]" onClick={(e) => e.stopPropagation()}>
                  <InfoModal
                    title={ref.name}
                    content={<p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{ref.description}</p>}
                  />
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0 text-xs lg:text-sm">
              <ItemMetaChips
                bare
                weight={ref.weight}
                value={isVariableMeta(ref.value) ? undefined : ref.value}
                availability={isVariableMeta(ref.availability) ? undefined : ref.availability}
                source={ref.source}
              />
              {isVariableMeta(ref.value) && (
                <span className="text-amber-400/70 italic">Cost assigned on add</span>
              )}
            </div>
          </div>
        </div>
        ))
      )}
    </PickerModal>
  );
}
