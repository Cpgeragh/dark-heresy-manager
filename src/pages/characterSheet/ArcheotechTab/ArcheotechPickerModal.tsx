// src/pages/characterSheet/ArcheotechTab/ArcheotechPickerModal.tsx

import { useState, useMemo } from "react";
import {
  ARCHEOTECH_REFERENCE,
  type ArcheotechRef,
} from "../../../data/reference/archeotechReference";
import { editableInputClass, uiTextBody, uiTextMuted, uiFormLabel, uiInfoModalWrapper, uiItemName, uiTextGMNote } from "../../../ui/editableStyles";
import { uiPickerBackButton } from "../../../ui/buttonStyles";
import { StatusBadge } from "../../../ui/StatusBadge";
import { AVAILABILITY_OPTIONS } from "./archeotechConstants";
import { PickerModal } from "../../../ui/PickerModal";
import { Button } from "../../../ui/Button";
import { InfoModal } from "../../../components/InfoModal";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { formatMoneyInput, sanitizeMoneyInput } from "../../../ui/moneyFormat";
import type { CampaignCustomItem } from "../../../types/CustomItems";

interface Props {
  editable?: boolean;
  customItems?: CampaignCustomItem<"archeotech">[];
  onSelect: (ref: ArcheotechRef, gmValue?: string, gmRarity?: string) => void;
  onSelectCustomItem?: (item: CampaignCustomItem<"archeotech">) => void;
  onCustom: () => void;
  onClose: () => void;
}

export function ArcheotechPickerModal({
  editable = true,
  customItems = [],
  onSelect,
  onSelectCustomItem,
  onCustom,
  onClose,
}: Props) {
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
  const filteredCustom = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return customItems
      .filter((item) => item.status !== "archived")
      .filter(
        (item) =>
          !normalizedQuery ||
          item.name.toLowerCase().includes(normalizedQuery) ||
          item.data.type?.toLowerCase().includes(normalizedQuery)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [customItems, query]);

  const isUnknownMeta = (value?: string) => {
    const normalized = value?.trim().toLowerCase();
    return !normalized || normalized === "—" || normalized === "variable" || normalized === "varies";
  };
  const needsGmInput = (ref: ArcheotechRef) => isUnknownMeta(ref.value) || isUnknownMeta(ref.availability);

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
  const costValid = gmCost.trim() !== "" && Number.isInteger(costNum) && costNum >= 0;
  const canConfirm = costValid && gmRarity !== "";

  function handleConfirm() {
    if (!pending || !canConfirm) return;
    onSelect(pending, formatMoneyInput(gmCost), gmRarity);
  }

  return (
    <PickerModal
      title={pending ? "GM-Assigned Values" : editable ? "Add Archeotech" : "View Archeotech"}
      placeholder="Search archeotech…"
      query={query}
      onQueryChange={setQuery}
      onClose={pending ? () => setPending(null) : onClose}
      closeLabel={pending ? "←" : "×"}
      isEmpty={!pending && filtered.length === 0 && filteredCustom.length === 0}
      hideSearch={!!pending}
      footer={
        !pending && editable ? (
          <button
            onClick={onCustom}
            className="w-full text-sm lg:text-base text-red-500 hover:text-red-400 text-center py-1 lg:py-1.5"
          >
            + Add custom item
          </button>
        ) : undefined
      }
    >
      {pending ? (
        // ── Step 2: GM form ──────────────────────────────────────────────────
        <div className="p-4 lg:p-5 space-y-4">
          <p className={`text-sm lg:text-base ${uiTextBody}`}>
            <span className="font-medium text-slate-200">{pending.name}</span> has no standard cost
            or availability. Enter the values the GM has assigned.
          </p>

          <div className="space-y-1">
            <label className={uiFormLabel}>
              Cost (Thrones) <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={gmCost}
              onChange={(e) => setGmCost(sanitizeMoneyInput(e.target.value))}
              placeholder="e.g. 5000"
              className={editableInputClass(true)}
            />
            {gmCost.trim() !== "" && !costValid && (
              <p className="text-xs lg:text-sm text-red-400">Must be a whole number of 0 or more.</p>
            )}
          </div>

          <div className="space-y-1">
            <label className={uiFormLabel}>
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

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setPending(null)}
              className={uiPickerBackButton}
            >
              Back
            </button>
            <Button className="flex-1" onClick={handleConfirm} disabled={!canConfirm}>
              Add to Inventory
            </Button>
          </div>
        </div>
      ) : (
        // ── Step 1: Search list ──────────────────────────────────────────────
        <>
        {filteredCustom.map((item) => (
          <div
            key={`custom-${item.id}`}
            role="button"
            tabIndex={editable ? 0 : -1}
            onClick={editable && onSelectCustomItem ? () => onSelectCustomItem(item) : undefined}
            className={`w-full text-left px-4 lg:px-5 py-3 lg:py-4 transition group ${editable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"}`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={`${uiItemName} truncate ${editable ? "group-hover:text-white" : ""}`}
              >
                {item.name}
              </span>
              <StatusBadge status={item.status} />
              {item.data.description && (
                <span className={uiInfoModalWrapper} onClick={(e) => e.stopPropagation()}>
                  <InfoModal
                    title={item.name}
                    content={<p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{item.data.description}</p>}
                  />
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs lg:text-sm mt-0.5 flex-wrap">
              {item.data.type && <span className={uiTextMuted}>{item.data.type}</span>}
              <ItemMetaChips
                bare
                weight={item.data.weight}
                value={item.data.value}
                availability={item.data.availability}
                source={item.data.source}
              />
            </div>
          </div>
        ))}

        {filtered.map((ref) => (
          <button
            key={ref.id}
            onClick={editable ? () => handleRowClick(ref) : undefined}
            className={`w-full text-left px-4 lg:px-5 py-3 lg:py-4 transition group ${editable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"}`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={`${uiItemName} truncate ${editable ? "group-hover:text-white" : ""}`}
              >
                {ref.name}
              </span>
              {ref.description && (
                <span className={uiInfoModalWrapper} onClick={(e) => e.stopPropagation()}>
                  <InfoModal
                    title={ref.name}
                    content={<p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{ref.description}</p>}
                  />
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs lg:text-sm mt-0.5 flex-wrap">
              <span className={uiTextMuted}>{ref.type}</span>
              <ItemMetaChips
                bare
                weight={ref.weight}
                value={isUnknownMeta(ref.value) ? undefined : ref.value}
                availability={isUnknownMeta(ref.availability) ? undefined : ref.availability}
                source={ref.source}
              />
              {needsGmInput(ref) && (
                <span className={uiTextGMNote}>GM determines cost &amp; availability</span>
              )}
            </div>
          </button>
        ))}
        </>
      )}
    </PickerModal>
  );
}
