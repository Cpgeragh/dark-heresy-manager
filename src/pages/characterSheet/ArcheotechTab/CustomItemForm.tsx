// src/pages/characterSheet/ArcheotechTab/CustomItemForm.tsx

import { useState } from "react";
import type { ArcheotechItem } from "../../../types/Character";
import { editableInputClass, editableTextareaClass, uiSection, uiSectionHeader } from "../../../ui/editableStyles";
import { Button } from "../../../ui/Button";
import { formatWeightInput, sanitizeWeightInput } from "../../../ui/weightFormat";
import { formatMoneyInput, sanitizeMoneyInput } from "../../../ui/moneyFormat";
import { PickerModal } from "../../../ui/PickerModal";
import { ITEM_TYPES, AVAILABILITY_OPTIONS, type ItemType } from "./archeotechConstants";

interface Props {
  initialItem?: Partial<ArcheotechItem>;
  title?: string;
  submitLabel?: string;
  onAdd: (item: ArcheotechItem) => void | Promise<void>;
  onCancel: () => void;
}

export function CustomItemForm({
  initialItem,
  title = "Custom Archeotech Item",
  submitLabel = "Add Item",
  onAdd,
  onCancel,
}: Props) {
  const [name, setName] = useState(initialItem?.name ?? "");
  const [type, setType] = useState<ItemType | "">((initialItem?.type as ItemType | undefined) ?? "");
  const [description, setDescription] = useState(initialItem?.description ?? "");
  const [notes, setNotes] = useState(initialItem?.notes ?? "");
  const [weight, setWeight] = useState(initialItem?.weight ?? "");
  const [value, setValue] = useState(initialItem?.value ?? "");
  const [availability, setRarity] = useState(initialItem?.availability ?? "");
  const [saving, setSaving] = useState(false);

  const canAdd = name.trim().length > 0;

  function handleWeightChange(val: string) {
    setWeight(sanitizeWeightInput(val));
  }

  function handleValueChange(val: string) {
    setValue(sanitizeMoneyInput(val));
  }

  async function handleAdd() {
    if (!canAdd) return;
    setSaving(true);
    try {
      await onAdd({
        id: initialItem?.id ?? crypto.randomUUID(),
        name: name.trim(),
        type: type || undefined,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        weight: formatWeightInput(weight),
        value: formatMoneyInput(value),
        availability: availability || undefined,
        customLibraryId: initialItem?.customLibraryId,
        customLibraryVersionId: initialItem?.customLibraryVersionId,
        equipped: initialItem?.equipped,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <PickerModal
      title={title}
      query=""
      onQueryChange={() => {}}
      onClose={onCancel}
      isEmpty={false}
      hideSearch
      maxHeight="max-h-[92vh]"
      footer={
        <div className="space-y-2">
          {!canAdd && (
            <p className="text-xs lg:text-sm text-slate-300">
              <span className="text-red-500">*</span> Required
            </p>
          )}
          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleAdd} disabled={!canAdd || saving}>
              {saving ? "Saving..." : submitLabel}
            </Button>
            <button
              onClick={onCancel}
              className="px-4 lg:px-5 py-1.5 lg:py-2 rounded border border-slate-500 bg-slate-800 hover:bg-slate-700 text-sm lg:text-base text-slate-100"
            >
              Cancel
            </button>
          </div>
        </div>
      }
    >
      <div className="p-4 lg:p-5 space-y-4">
        <p className={uiSectionHeader}>Identity</p>
        <div className={uiSection + " space-y-3"}>
          <div>
            <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Item name…"
              className={editableInputClass(true) + " mt-0.5"}
              autoFocus
            />
          </div>
        </div>

        <p className={uiSectionHeader}>Details</p>
        <div className={uiSection + " space-y-3"}>
          <div>
            <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
              Type <span className="text-slate-600">(optional)</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ItemType | "")}
              className={editableInputClass(true) + " mt-0.5 appearance-none"}
            >
              <option value="">— Select type —</option>
              {ITEM_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                Weight
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={weight}
                onChange={(e) => handleWeightChange(e.target.value)}
                placeholder="e.g. 2"
                className={editableInputClass(true) + " mt-0.5"}
              />
            </div>
            <div>
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                Value
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={value}
                onChange={(e) => handleValueChange(e.target.value)}
                placeholder="e.g. 1000"
                className={editableInputClass(true) + " mt-0.5"}
              />
            </div>
          </div>
          <div>
            <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
              Rarity <span className="text-slate-600">(optional)</span>
            </label>
            <select
              value={availability}
              onChange={(e) => setRarity(e.target.value)}
              className={editableInputClass(true) + " mt-0.5 appearance-none"}
            >
              <option value="">— Select availability —</option>
              {AVAILABILITY_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        <p className={uiSectionHeader}>Rules</p>
        <div className={uiSection + " space-y-3"}>
          <div>
            <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
              Description / Rules <span className="text-slate-600">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Rules text, special properties…"
              rows={3}
              className={editableTextareaClass(true) + " mt-0.5"}
            />
          </div>
          <div>
            <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
              Notes <span className="text-slate-600">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Personal notes, where it was found…"
              rows={2}
              className={editableTextareaClass(true) + " mt-0.5"}
            />
          </div>
        </div>
      </div>
    </PickerModal>
  );
}
