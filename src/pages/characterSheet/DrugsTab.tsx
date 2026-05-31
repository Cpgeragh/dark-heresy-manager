// src/pages/characterSheet/DrugsTab.tsx

import { useState, useCallback } from "react";
import type { DrugItem } from "../../types/Character";
import { DRUGS_REFERENCE, type DrugRef } from "../../data/reference/drugsReference";
import {
  editableInputClass,
  sectionContainerClass,
} from "../../ui/editableStyles";
import { rarityColour } from "../../ui/sourceStyles";
import { ItemMetaChips } from "../../ui/ItemMetaChips";
import { QuantityControl } from "../../ui/QuantityControl";
import { PickerModal } from "../../ui/PickerModal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DrugsTabProps {
  drugs: DrugItem[];
  editable: boolean;
  onUpdate: (next: DrugItem[]) => void;
}

// ─── Drug Info Modal ──────────────────────────────────────────────────────────

function DrugInfoModal({
  item,
  onClose,
}: {
  item: DrugItem;
  onClose: () => void;
}) {
  const ref = DRUGS_REFERENCE.find((r) => r.id === item.referenceId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-slate-200">{item.name}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-lg leading-none"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-4">
          {/* Cost / Rarity / Duration */}
          <div className="flex flex-wrap gap-3 text-xs text-slate-400">
            {(item.value ?? ref?.value) && (
              <span>
                ₮ <span className="text-amber-400/80 font-mono">{item.value ?? ref?.value}</span>
              </span>
            )}
            {(item.rarity ?? ref?.rarity) && (
              <span className={rarityColour(item.rarity ?? ref?.rarity)}>
                {item.rarity ?? ref?.rarity}
              </span>
            )}
            {ref?.duration && (
              <span>
                ⏱ <span className="text-slate-300">{ref.duration}</span>
              </span>
            )}
          </div>

          {/* Effect */}
          {ref?.effect && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Effect
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">{ref.effect}</p>
            </div>
          )}

          {/* Side effects */}
          {ref?.sideEffect && (
            <div>
              <p className="text-xs font-semibold text-red-500/70 uppercase tracking-wide mb-1">
                Side Effects
              </p>
              <p className="text-sm text-slate-400 leading-relaxed">{ref.sideEffect}</p>
            </div>
          )}

          {/* General notes */}
          {ref?.notes && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Notes
              </p>
              <p className="text-sm text-slate-400 leading-relaxed">{ref.notes}</p>
            </div>
          )}

          {/* Player notes */}
          {item.notes && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Player Notes
              </p>
              <p className="text-sm text-slate-400 leading-relaxed">{item.notes}</p>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-700">
          <button
            onClick={onClose}
            className="w-full py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sm text-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Drug Picker ──────────────────────────────────────────────────────────────

function DrugPicker({
  onSelect,
  onClose,
}: {
  onSelect: (ref: DrugRef) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = DRUGS_REFERENCE.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <PickerModal
      title="Add Drug"
      placeholder="Search drugs…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={filtered.length === 0}
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
            <div className="flex items-center gap-2 shrink-0 text-xs">
              <span className="text-amber-400/80 font-mono">₮ {ref.value}</span>
              <span className={rarityColour(ref.rarity)}>{ref.rarity}</span>
            </div>
          </div>
          {ref.duration && (
            <p className="text-xs text-slate-500 mt-0.5">⏱ {ref.duration}</p>
          )}
          {ref.effect && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{ref.effect}</p>
          )}
        </button>
      ))}
    </PickerModal>
  );
}

// ─── Drug Row ─────────────────────────────────────────────────────────────────

function DrugRow({
  item,
  editable,
  onUpdateQty,
  onRemove,
  onInfo,
}: {
  item: DrugItem;
  editable: boolean;
  onUpdateQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onInfo: (item: DrugItem) => void;
}) {
  const ref = DRUGS_REFERENCE.find((r) => r.id === item.referenceId);

  return (
    <div className={[sectionContainerClass(editable), "flex items-center gap-3"].join(" ")}>
      {/* Name + duration + chips */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200">{item.name}</p>
        {ref?.duration && (
          <p className="text-xs text-slate-500 mt-0.5">⏱ {ref.duration}</p>
        )}
        <ItemMetaChips
          value={item.value ?? ref?.value}
          rarity={item.rarity ?? ref?.rarity}
          source={item.source}
          valueAmber
          className="flex flex-wrap gap-1.5 mt-1"
        />
      </div>

      {/* Quantity controls */}
      <QuantityControl
        quantity={item.quantity}
        editable={editable}
        onUpdate={(q) => onUpdateQty(item.id, q)}
      />

      {/* Info */}
      <button
        onClick={() => onInfo(item)}
        title="View rules"
        className="text-slate-500 hover:text-slate-300 text-sm px-1 transition shrink-0"
      >
        ⓘ
      </button>

      {/* Remove */}
      {editable && (
        <button
          onClick={() => onRemove(item.id)}
          className="text-xs text-red-400 hover:text-red-300 transition shrink-0"
        >
          Remove
        </button>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DrugsTab({ drugs, editable, onUpdate }: DrugsTabProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [infoTarget, setInfoTarget] = useState<DrugItem | null>(null);

  const addDrug = useCallback(
    (ref: DrugRef) => {
      if (!editable) return;
      onUpdate([
        ...drugs,
        {
          id: crypto.randomUUID(),
          referenceId: ref.id,
          name: ref.name,
          quantity: 1,
          value: ref.value,
          rarity: ref.rarity,
          source: ref.source,
        },
      ]);
      setShowPicker(false);
    },
    [editable, drugs, onUpdate]
  );

  const updateQty = useCallback(
    (id: string, quantity: number) => {
      if (!editable) return;
      onUpdate(drugs.map((d) => (d.id === id ? { ...d, quantity } : d)));
    },
    [editable, drugs, onUpdate]
  );

  const removeDrug = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdate(drugs.filter((d) => d.id !== id));
    },
    [editable, drugs, onUpdate]
  );

  return (
    <div className="space-y-6 text-slate-300">
      <h2 className="text-xl font-semibold">Drugs</h2>

      {/* Excessive Drug Use rule */}
      <div className="rounded-lg border border-violet-700/40 bg-violet-900/10 px-4 py-3 text-xs text-slate-400 leading-relaxed">
        <span className="font-semibold text-violet-400 uppercase tracking-wide mr-1">
          Excessive Drug Use ·
        </span>
        Using more than one dose of the same drug within a 24-hour period requires a Toughness Test
        for each use after the first, with a cumulative –20 penalty. On a failure, the drug has no
        effect and further doses do not affect the character for a full 24 hours.
      </div>

      {/* Carried drugs */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Carried ({drugs.length})
          </h3>
          {editable && (
            <button
              onClick={() => setShowPicker(true)}
              className="text-xs px-3 py-1 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 transition"
            >
              + Add
            </button>
          )}
        </div>

        {drugs.length === 0 && (
          <p className="text-sm text-slate-500 italic">No drugs carried.</p>
        )}

        {drugs.map((item) => (
          <DrugRow
            key={item.id}
            item={item}
            editable={editable}
            onUpdateQty={updateQty}
            onRemove={removeDrug}
            onInfo={setInfoTarget}
          />
        ))}
      </section>

      <p className="text-xs text-slate-600">
        Cost shown is per dose. Tap ⓘ to view full effect, duration and side effects.
      </p>

      {showPicker && (
        <DrugPicker
          onSelect={addDrug}
          onClose={() => setShowPicker(false)}
        />
      )}

      {infoTarget && (
        <DrugInfoModal
          item={infoTarget}
          onClose={() => setInfoTarget(null)}
        />
      )}
    </div>
  );
}
