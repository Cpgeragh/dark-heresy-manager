// src/pages/characterSheet/ArcheotechTab.tsx

import { useState, useCallback, useMemo } from "react";
import type { ArcheotechItem } from "../../types/Character";
import {
  ARCHEOTECH_REFERENCE,
  type ArcheotechRef,
} from "../../data/reference/archeotechReference";
import {
  editableInputClass,
  editableTextareaClass,
  sectionContainerClass,
} from "../../ui/editableStyles";
import { rarityColour, sourceColour } from "../../ui/sourceStyles";
import { InfoModal } from "../../components/InfoModal";

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEM_TYPES = ["Weapon", "Grenade", "Mine", "Device", "Tool", "Other"] as const;
type ItemType = typeof ITEM_TYPES[number];

const RARITY_OPTIONS = [
  "Plentiful", "Common", "Average", "Scarce", "Rare",
  "Very Rare", "Extremely Rare", "Near Unique", "Unique",
] as const;

// ─── Props ───────────────────────────────────────────────────────────────────

interface ArcheotechTabProps {
  archeotech: ArcheotechItem[];
  editable: boolean;
  onUpdate: (next: ArcheotechItem[]) => void;
}

// ─── Reference Picker Modal ───────────────────────────────────────────────────

function ArcheotechPickerModal({
  onSelect,
  onClose,
}: {
  onSelect: (ref: ArcheotechRef, gmValue?: string, gmRarity?: string) => void;
  onClose: () => void;
}) {
  const [query,    setQuery]    = useState("");
  const [pending,  setPending]  = useState<ArcheotechRef | null>(null);
  const [gmCost,   setGmCost]   = useState("");
  const [gmRarity, setGmRarity] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...ARCHEOTECH_REFERENCE]
      .filter((r) => !q || r.name.toLowerCase().includes(q) || r.type.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [query]);

  const needsGmInput = (ref: ArcheotechRef) =>
    ref.value === "—" || ref.rarity === "—";

  function handleRowClick(ref: ArcheotechRef) {
    if (needsGmInput(ref)) {
      setPending(ref);
      setGmCost("");
      setGmRarity("");
    } else {
      onSelect(ref);
    }
  }

  const costNum   = Number(gmCost);
  const costValid = gmCost.trim() !== "" && Number.isInteger(costNum) && costNum >= 1;
  const canConfirm = costValid && gmRarity !== "";

  function handleConfirm() {
    if (!pending || !canConfirm) return;
    onSelect(pending, `${gmCost} Thrones`, gmRarity);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[80vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-slate-200">
            {pending ? "GM-Assigned Values" : "Add Known Archeotech"}
          </h3>
          <button
            onClick={pending ? () => setPending(null) : onClose}
            className="text-slate-400 hover:text-slate-200 text-lg leading-none"
          >
            {pending ? "←" : "×"}
          </button>
        </div>

        {/* Step 2 — GM values */}
        {pending ? (
          <div className="p-4 space-y-4 overflow-y-auto">
            <p className="text-sm text-slate-400">
              <span className="font-medium text-slate-200">{pending.name}</span> has no
              standard cost or availability. Enter the values the GM has assigned.
            </p>

            {/* Cost */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400">
                Cost (Thrones) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min={1}
                step={1}
                autoFocus
                value={gmCost}
                onChange={(e) => setGmCost(e.target.value)}
                placeholder="e.g. 5000"
                className={editableInputClass(true)}
              />
              {gmCost.trim() !== "" && !costValid && (
                <p className="text-xs text-red-400">Must be a whole number of 1 or more.</p>
              )}
            </div>

            {/* Rarity */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400">
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

            {/* Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setPending(null)}
                className="px-4 py-1.5 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 transition"
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
          <>
            {/* Search */}
            <div className="px-4 py-2 border-b border-slate-800">
              <input
                type="text"
                autoFocus
                placeholder="Search archeotech…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={editableInputClass(true)}
              />
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 divide-y divide-slate-800">
              {filtered.length === 0 && (
                <p className="p-4 text-sm text-slate-500 text-center">No matches.</p>
              )}
              {filtered.map((ref) => (
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
                    <p className="text-xs mt-0.5 text-amber-400/70 italic">GM determines cost & rarity</p>
                  )}
                  {ref.description && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{ref.description}</p>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Item Card ────────────────────────────────────────────────────────────────

function ItemCard({
  item,
  editable,
  onRemove,
}: {
  item: ArcheotechItem;
  editable: boolean;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const hasBody = !!(item.description?.trim() || item.notes?.trim());
  const ref = item.referenceId
    ? ARCHEOTECH_REFERENCE.find((r) => r.id === item.referenceId)
    : undefined;

  const description = item.description ?? ref?.description;
  const specialRules = ref?.specialRules;
  const weight  = item.weight  ?? ref?.weight;
  const value   = item.value   ?? ref?.value;
  const rarity  = item.rarity  ?? ref?.rarity;
  const source  = item.source  ?? ref?.source;

  return (
    <div className={sectionContainerClass(editable)}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">

          {/* Title row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-slate-200">{item.name}</span>
            {item.type && (
              <span className="text-xs text-slate-500 border border-slate-700 rounded px-1.5 py-0.5">
                {item.type}
              </span>
            )}
            {hasBody && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="text-slate-500 hover:text-slate-300 text-xs transition"
              >
                {expanded ? "▲" : "▼"}
              </button>
            )}
            {description && !hasBody && (
              <InfoModal title={item.name} content={description} />
            )}
          </div>

          {/* Expanded body */}
          {expanded && (
            <div className="mt-2 space-y-1.5">
              {specialRules && (
                <p className="text-xs text-slate-400">
                  <span className="text-slate-500 uppercase tracking-wide text-[10px] mr-1">Special</span>
                  {specialRules}
                </p>
              )}
              {description && (
                <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
              )}
              {item.notes?.trim() && (
                <p className="text-xs text-amber-300/70 italic leading-relaxed">
                  {item.notes}
                </p>
              )}
            </div>
          )}

          {/* Chips */}
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {weight && (
              <span className="text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-slate-400">
                ⚖ {weight}
              </span>
            )}
            {value && (
              <span className="text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-amber-400/80 font-mono">
                ₮ {value}
              </span>
            )}
            {rarity && (
              <span className={`text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 ${rarityColour(rarity)}`}>
                {rarity}
              </span>
            )}
            {source && (
              <span className={`text-xs rounded border bg-slate-800/40 px-1.5 py-0.5 font-mono ${sourceColour(source)}`}>
                {source}
              </span>
            )}
          </div>
        </div>

        {editable && (
          <button
            onClick={onRemove}
            className="text-xs text-red-400 hover:text-red-300 transition shrink-0 mt-0.5"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Custom Item Form ─────────────────────────────────────────────────────────

function CustomItemForm({
  onAdd,
  onCancel,
}: {
  onAdd: (item: ArcheotechItem) => void;
  onCancel: () => void;
}) {
  const [name,        setName]        = useState("");
  const [type,        setType]        = useState<ItemType | "">("");
  const [description, setDescription] = useState("");
  const [notes,       setNotes]       = useState("");
  const [weight,      setWeight]      = useState("");
  const [value,       setValue]       = useState("");
  const [rarity,      setRarity]      = useState("");

  const canAdd = name.trim().length > 0;

  function handleAdd() {
    if (!canAdd) return;
    onAdd({
      id:          crypto.randomUUID(),
      name:        name.trim(),
      type:        type || undefined,
      description: description.trim() || undefined,
      notes:       notes.trim() || undefined,
      weight:      weight.trim() || undefined,
      value:       value.trim() || undefined,
      rarity:      rarity || undefined,
    });
  }

  return (
    <div className="border border-amber-500/30 bg-slate-900/60 rounded-lg p-4 space-y-3">
      <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
        Custom Archeotech Item
      </p>

      {/* Name */}
      <div className="space-y-1">
        <label className="text-xs text-slate-400">Name <span className="text-red-400">*</span></label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Item name…"
          className={editableInputClass(true)}
          autoFocus
        />
      </div>

      {/* Type */}
      <div className="space-y-1">
        <label className="text-xs text-slate-400">Type <span className="text-slate-600">(optional)</span></label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ItemType | "")}
          className={editableInputClass(true) + " appearance-none"}
        >
          <option value="">— Select type —</option>
          {ITEM_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Weight + Value on one row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-slate-400">Weight <span className="text-slate-600">(optional)</span></label>
          <input
            type="text"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g. 2 kg"
            className={editableInputClass(true)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-400">Value <span className="text-slate-600">(optional)</span></label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. Priceless"
            className={editableInputClass(true)}
          />
        </div>
      </div>

      {/* Rarity */}
      <div className="space-y-1">
        <label className="text-xs text-slate-400">Rarity <span className="text-slate-600">(optional)</span></label>
        <select
          value={rarity}
          onChange={(e) => setRarity(e.target.value)}
          className={editableInputClass(true) + " appearance-none"}
        >
          <option value="">— Select rarity —</option>
          {RARITY_OPTIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label className="text-xs text-slate-400">
          Description / Rules <span className="text-slate-600">(optional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Rules text, special properties…"
          rows={3}
          className={editableTextareaClass(true)}
        />
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <label className="text-xs text-slate-400">
          Notes <span className="text-slate-600">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Personal notes, where it was found…"
          rows={2}
          className={editableTextareaClass(true)}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleAdd}
          disabled={!canAdd}
          className="flex-1 py-1.5 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm text-slate-900 font-semibold transition"
        >
          Add Item
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-1.5 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ArcheotechTab({ archeotech, editable, onUpdate }: ArcheotechTabProps) {
  const [showPicker,     setShowPicker]     = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);

  const addFromRef = useCallback(
    (ref: ArcheotechRef, gmValue?: string, gmRarity?: string) => {
      if (!editable) return;
      onUpdate([
        ...archeotech,
        {
          id:          crypto.randomUUID(),
          referenceId: ref.id,
          name:        ref.name,
          type:        ref.type,
          source:      ref.source,
          // Store GM-assigned values directly on the item so they override "—"
          value:       gmValue  || undefined,
          rarity:      gmRarity || undefined,
        },
      ]);
      setShowPicker(false);
    },
    [editable, archeotech, onUpdate]
  );

  const addCustom = useCallback(
    (item: ArcheotechItem) => {
      if (!editable) return;
      onUpdate([...archeotech, item]);
      setShowCustomForm(false);
    },
    [editable, archeotech, onUpdate]
  );

  const removeItem = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdate(archeotech.filter((a) => a.id !== id));
    },
    [editable, archeotech, onUpdate]
  );

  return (
    <div className="space-y-8 text-slate-300">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Archeotech</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ancient technology of the Dark Age. Most items have no standard cost or availability —
            acquisition is left entirely to the GM.
          </p>
        </div>
      </div>

      {/* ── INVENTORY ─────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Inventory ({archeotech.length})
          </h3>
          {editable && !showCustomForm && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowPicker(true)}
                className="text-xs px-3 py-1 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 transition"
              >
                + From Reference
              </button>
              <button
                onClick={() => setShowCustomForm(true)}
                className="text-xs px-3 py-1 rounded border border-amber-600/50 bg-amber-600/10 text-amber-400 hover:bg-amber-600/20 transition"
              >
                + Custom Item
              </button>
            </div>
          )}
        </div>

        {archeotech.length === 0 && !showCustomForm && (
          <p className="text-sm text-slate-500 italic">No archeotech recorded.</p>
        )}

        {archeotech.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            editable={editable}
            onRemove={() => removeItem(item.id)}
          />
        ))}

        {showCustomForm && (
          <CustomItemForm
            onAdd={addCustom}
            onCancel={() => setShowCustomForm(false)}
          />
        )}
      </section>

      {/* ── MODAL ─────────────────────────────────────────────────────────── */}
      {showPicker && (
        <ArcheotechPickerModal
          onSelect={addFromRef}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
