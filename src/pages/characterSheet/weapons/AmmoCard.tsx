// src/pages/characterSheet/weapons/AmmoCard.tsx
// AmmoPicker, CustomAmmoForm, AmmoCard — co-located for navigability.

import { useState } from "react";
import type { AmmoItem } from "../../../types/Character";
import { AMMO_REFERENCE, type AmmoRef } from "../../../data/reference/ammoReference";
import { editableInputClass, sectionContainerClass } from "../../../ui/editableStyles";
import { rarityColour, sourceColour } from "../../../ui/sourceStyles";
import { QuantityControl } from "../../../ui/QuantityControl";
import { PickerModal } from "../../../ui/PickerModal";
import { InfoModal } from "../../../components/InfoModal";

// ─── Ammo Picker ──────────────────────────────────────────────────────────────

export function AmmoPicker({
  onSelect,
  onCustom,
  onClose,
}: {
  onSelect: (ref: AmmoRef) => void;
  onCustom: () => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = AMMO_REFERENCE.filter(
    (r) =>
      r.name.toLowerCase().includes(query.toLowerCase()) ||
      r.compatibleWith.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <PickerModal
      title="Add Ammunition"
      placeholder="Search by name or weapon type…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={filtered.length === 0}
      footer={
        <button
          onClick={onCustom}
          className="w-full text-sm text-amber-400 hover:text-amber-300 text-center py-1"
        >
          + Add custom ammunition
        </button>
      }
    >
      {filtered.map((ref) => (
        <button
          key={ref.id}
          onClick={() => onSelect(ref)}
          className="w-full text-left px-4 py-3 hover:bg-slate-800 transition group"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-200 group-hover:text-white">
              {ref.name}
            </span>
            <div className="flex items-center gap-1.5 text-xs shrink-0">
              <span className={rarityColour(ref.rarity)}>{ref.rarity}</span>
              <span className="text-slate-600">·</span>
              <span className="text-amber-400/80 font-mono">₮ {ref.cost}</span>
              <span className="text-slate-500">×</span>
              <span className="text-slate-200 font-mono">{ref.purchaseAmount}</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 text-left">{ref.compatibleWith}</p>
        </button>
      ))}
    </PickerModal>
  );
}

// ─── Custom Ammo Form ─────────────────────────────────────────────────────────

export function CustomAmmoForm({
  onAdd,
  onCancel,
}: {
  onAdd: (item: AmmoItem) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [compatibleWith, setCompatibleWith] = useState("");
  const [amount, setAmount] = useState(0);
  const [weight, setWeight] = useState("");
  const [value, setValue] = useState("");
  const [rarity, setRarity] = useState("");

  return (
    <div className="border border-amber-500/30 bg-slate-900/60 rounded-lg p-4 space-y-3">
      <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
        Custom Ammunition
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-100">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Hellfire Rounds"
            className={editableInputClass(true) + " mt-0.5"}
          />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-100">
            Compatible With <span className="text-slate-600">(optional)</span>
          </label>
          <input
            type="text"
            value={compatibleWith}
            onChange={(e) => setCompatibleWith(e.target.value)}
            placeholder="e.g. Bolt, SP Pistol"
            className={editableInputClass(true) + " mt-0.5"}
          />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-100">Starting Amount</label>
          <input
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
            className={editableInputClass(true) + " mt-0.5"}
          />
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-slate-100">
            Weight <span className="text-slate-600">(optional)</span>
          </label>
          <input
            type="text"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g. 0.5 kg"
            className={editableInputClass(true) + " mt-0.5"}
          />
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-slate-100">
            Value <span className="text-slate-600">(optional)</span>
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. 30 Thrones"
            className={editableInputClass(true) + " mt-0.5"}
          />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-100">
            Rarity <span className="text-slate-600">(optional)</span>
          </label>
          <input
            type="text"
            value={rarity}
            onChange={(e) => setRarity(e.target.value)}
            placeholder="e.g. Scarce"
            className={editableInputClass(true) + " mt-0.5"}
          />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={() =>
            onAdd({
              id: crypto.randomUUID(),
              name: name.trim(),
              compatibleWith: compatibleWith.trim() || undefined,
              amount,
              weight: weight.trim() || undefined,
              value: value.trim() || undefined,
              rarity: rarity.trim() || undefined,
            })
          }
          disabled={!name.trim()}
          className="flex-1 py-1.5 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-sm text-slate-900 font-semibold"
        >
          Add
        </button>
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

// ─── Ammo Card ────────────────────────────────────────────────────────────────

export function formatAmmoValue(value: string) {
  const parts = value.split(" / ");
  if (parts.length === 2) {
    return (
      <span className="text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5">
        <span className="text-amber-400/80 font-mono">₮ {parts[0]}</span>
        <span className="text-slate-500"> × </span>
        <span className="text-slate-200 font-mono">{parts[1]}</span>
      </span>
    );
  }
  return (
    <span className="text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-slate-400">
      ₮ {value}
    </span>
  );
}

export function AmmoCard({
  item,
  editable,
  onRemove,
  onUpdateAmount,
}: {
  item: AmmoItem;
  editable: boolean;
  onRemove: () => void;
  onUpdateAmount: (amount: number) => void;
}) {
  return (
    <div className={sectionContainerClass(editable)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-200">{item.name}</p>
          {item.compatibleWith && (
            <span className="inline-block mt-0.5 text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-slate-400">
              {item.compatibleWith}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {(item.description || item.compatibleWith) && (
            <InfoModal
              title={item.name}
              content={
                <div className="space-y-2">
                  {item.compatibleWith && (
                    <p className="text-sm text-slate-300">
                      <span className="text-slate-500">Used with: </span>
                      {item.compatibleWith}
                    </p>
                  )}
                  {item.description && (
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
              }
            />
          )}
          {editable && (
            <button
              onClick={onRemove}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Quantity */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400 uppercase tracking-wide">Qty</span>
        <QuantityControl
          quantity={item.amount}
          editable={editable}
          size="lg"
          onUpdate={onUpdateAmount}
        />
      </div>

      {/* Weight / Value / Rarity / Source — ammo has a special "cost × qty" format */}
      {(item.weight || item.value || item.rarity || item.source) && (
        <div className="flex flex-wrap gap-1.5 border-t border-slate-800 pt-2 mt-2">
          {item.weight && (
            <span className="text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-slate-400">
              ⚖ {item.weight}
            </span>
          )}
          {item.value && formatAmmoValue(item.value)}
          {item.rarity && (
            <span
              className={`text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 ${rarityColour(item.rarity)}`}
            >
              {item.rarity}
            </span>
          )}
          {item.source && (
            <span
              className={`text-xs rounded border bg-slate-800/40 px-1.5 py-0.5 font-mono ${sourceColour(item.source)}`}
            >
              {item.source}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
