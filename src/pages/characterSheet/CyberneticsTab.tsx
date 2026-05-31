// src/pages/characterSheet/CyberneticsTab.tsx

import { useState, useCallback } from "react";
import type { CyberneticItem, CyberneticCraftsmanship, ArmourLocationKey } from "../../types/Character";
import { CYBERNETICS_REFERENCE, type CyberneticRef } from "../../data/reference/cyberneticsReference";
import {
  editableInputClass,
  sectionContainerClass,
} from "../../ui/editableStyles";
import { rarityColour, sourceColour } from "../../ui/sourceStyles";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CyberneticsTabProps {
  cybernetics: CyberneticItem[];
  editable: boolean;
  onUpdate: (next: CyberneticItem[]) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CRAFTSMANSHIP_ORDER: CyberneticCraftsmanship[] = ["Poor", "Common", "Good"];

const CRAFTSMANSHIP_STYLE: Record<CyberneticCraftsmanship, string> = {
  Poor:   "border-red-600   bg-red-900/30   text-red-400",
  Common: "border-green-600 bg-green-900/30 text-green-400",
  Good:   "border-amber-500 bg-amber-900/30 text-amber-300",
};

const LOCATION_DISPLAY: Partial<Record<ArmourLocationKey, string>> = {
  leftArm:  "Left Arm",
  rightArm: "Right Arm",
  leftLeg:  "Left Leg",
  rightLeg: "Right Leg",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nextCraftsmanship(current: CyberneticCraftsmanship): CyberneticCraftsmanship {
  const idx = CRAFTSMANSHIP_ORDER.indexOf(current);
  return CRAFTSMANSHIP_ORDER[(idx + 1) % CRAFTSMANSHIP_ORDER.length];
}

function craftsmanshipDescription(ref: CyberneticRef, quality: CyberneticCraftsmanship): string {
  const desc = quality === "Poor" ? ref.poor : quality === "Good" ? ref.good : ref.common;
  return desc ?? "No specific rules for this craftsmanship level.";
}

// ─── Info Modal ───────────────────────────────────────────────────────────────

function CyberneticInfoModal({
  item,
  onClose,
}: {
  item: CyberneticItem;
  onClose: () => void;
}) {
  const ref = CYBERNETICS_REFERENCE.find((r) => r.id === item.referenceId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-200">{item.name}</h3>
            <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${CRAFTSMANSHIP_STYLE[item.craftsmanship]}`}>
              {item.craftsmanship}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-lg leading-none">×</button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-4">
          {/* Cost / rarity */}
          {ref && (
            <div className="flex flex-wrap gap-3 text-xs text-slate-400">
              <span>₮ <span className="text-amber-400/80 font-mono">{ref.value}</span></span>
              <span className={rarityColour(ref.rarity)}>{ref.rarity}</span>
            </div>
          )}

          {/* Craftsmanship rules */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              {item.craftsmanship} Quality
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              {ref ? craftsmanshipDescription(ref, item.craftsmanship) : item.notes ?? "No rules recorded."}
            </p>
          </div>

          {/* General notes */}
          {ref?.notes && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">General Rules</p>
              <p className="text-sm text-slate-400 leading-relaxed">{ref.notes}</p>
            </div>
          )}

          {/* Player notes */}
          {item.notes && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Notes</p>
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

// ─── Implant Picker ───────────────────────────────────────────────────────────

function ImplantPicker({
  onSelect,
  onClose,
}: {
  onSelect: (ref: CyberneticRef, craftsmanship: CyberneticCraftsmanship, bodyLocation?: ArmourLocationKey[]) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CyberneticRef | null>(null);
  const [location, setLocation] = useState<ArmourLocationKey[] | null>(null);
  const [craftsmanship, setCraftsmanship] = useState<CyberneticCraftsmanship>("Common");

  const filtered = CYBERNETICS_REFERENCE.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  // Reset to list
  const resetPicker = () => { setSelected(null); setLocation(null); };

  // ── Step 2: Location picker (arm/leg implants only) ───────────────────────
  if (selected && selected.requiresLocation && !location) {
    const isArm = selected.requiresLocation === "arm";
    const options: { label: string; value: ArmourLocationKey[] }[] = isArm
      ? [
          { label: "Left Arm",  value: ["leftArm"] },
          { label: "Right Arm", value: ["rightArm"] },
          { label: "Both Arms", value: ["leftArm", "rightArm"] },
        ]
      : [
          { label: "Left Leg",  value: ["leftLeg"] },
          { label: "Right Leg", value: ["rightLeg"] },
          { label: "Both Legs", value: ["leftLeg", "rightLeg"] },
        ];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <h3 className="text-sm font-semibold text-slate-200">{selected.name}</h3>
            <button onClick={resetPicker} className="text-slate-400 hover:text-slate-200 text-lg leading-none">×</button>
          </div>

          <div className="px-4 py-4 space-y-3">
            <p className="text-xs text-slate-400">Select installation side:</p>
            <div className="flex flex-col gap-2">
              {options.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setLocation(opt.value)}
                  className="py-2 px-3 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 text-sm text-slate-200 text-left transition"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 py-3 border-t border-slate-700">
            <button
              onClick={resetPicker}
              className="px-4 py-1.5 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 text-sm text-slate-300"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 3: Craftsmanship picker ──────────────────────────────────────────
  if (selected) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <h3 className="text-sm font-semibold text-slate-200">{selected.name}</h3>
            <button onClick={resetPicker} className="text-slate-400 hover:text-slate-200 text-lg leading-none">×</button>
          </div>

          <div className="px-4 py-4 space-y-4">
            {/* Location badge if set */}
            {location && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Installing on:</span>
                <span className="px-2 py-0.5 rounded border border-slate-600 bg-slate-800 text-slate-300">
                  {location.map((l) => LOCATION_DISPLAY[l]).join(" & ")}
                </span>
              </div>
            )}

            <div>
              <p className="text-xs text-slate-400 mb-2">Select craftsmanship quality:</p>
              <div className="flex gap-2">
                {CRAFTSMANSHIP_ORDER.map((q) => (
                  <button
                    key={q}
                    onClick={() => setCraftsmanship(q)}
                    className={[
                      "flex-1 py-1.5 rounded border text-sm font-medium transition",
                      craftsmanship === q
                        ? CRAFTSMANSHIP_STYLE[q]
                        : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500",
                    ].join(" ")}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-400 bg-slate-800/60 rounded p-3 leading-relaxed">
              {craftsmanshipDescription(selected, craftsmanship)}
            </div>
          </div>

          <div className="px-4 py-3 border-t border-slate-700 flex gap-2">
            <button
              onClick={resetPicker}
              className="px-4 py-1.5 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 text-sm text-slate-300"
            >
              Back
            </button>
            <button
              onClick={() => onSelect(selected, craftsmanship, location ?? undefined)}
              className="flex-1 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-sm text-slate-900 font-semibold"
            >
              Install
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 1: Search list ───────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-slate-200">Install Cybernetic</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-lg leading-none">×</button>
        </div>

        <div className="px-4 py-2 border-b border-slate-800">
          <input
            type="text"
            autoFocus
            placeholder="Search implants…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={editableInputClass(true)}
          />
        </div>

        <div className="overflow-y-auto flex-1 divide-y divide-slate-800">
          {filtered.length === 0 && (
            <p className="p-4 text-sm text-slate-500 text-center">No matches.</p>
          )}
          {filtered.map((ref) => (
            <button
              key={ref.id}
              onClick={() => setSelected(ref)}
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
              {ref.common && (
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{ref.common}</p>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Implant Row ──────────────────────────────────────────────────────────────

function ImplantRow({
  item,
  editable,
  onCycleQuality,
  onRemove,
  onInfo,
}: {
  item: CyberneticItem;
  editable: boolean;
  onCycleQuality: (id: string) => void;
  onRemove: (id: string) => void;
  onInfo: (item: CyberneticItem) => void;
}) {
  const ref = CYBERNETICS_REFERENCE.find((r) => r.id === item.referenceId);

  return (
    <div className={[sectionContainerClass(editable), "flex items-center gap-3"].join(" ")}>
      {/* Name + general description */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200">{item.name}</p>
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
          {craftsmanshipDescription(ref ?? {} as CyberneticRef, item.craftsmanship)}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {item.bodyLocation && item.bodyLocation.length > 0 && (
            <span className="text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-slate-400">
              {item.bodyLocation.map((l) => LOCATION_DISPLAY[l]).join(" & ")}
            </span>
          )}
          {(item.value ?? ref?.value) && (
            <span className="text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-amber-400/80 font-mono">
              ₮ {item.value ?? ref?.value}
            </span>
          )}
          {(item.rarity ?? ref?.rarity) && (
            <span className={`text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 ${rarityColour(item.rarity ?? ref?.rarity)}`}>
              {item.rarity ?? ref?.rarity}
            </span>
          )}
          {(item.source ?? ref?.source) && (
            <span className={`text-xs rounded border bg-slate-800/40 px-1.5 py-0.5 font-mono ${sourceColour(item.source ?? ref?.source ?? "")}`}>
              {item.source ?? ref?.source}
            </span>
          )}
        </div>
      </div>

      {/* Info button */}
      <button
        onClick={() => onInfo(item)}
        title="View rules"
        className="text-slate-500 hover:text-slate-300 text-sm px-1 transition shrink-0"
      >
        ⓘ
      </button>

      {/* Craftsmanship badge — clickable when editable */}
      <button
        onClick={() => editable && onCycleQuality(item.id)}
        title={editable ? `Click to change craftsmanship (currently ${item.craftsmanship})` : item.craftsmanship}
        disabled={!editable}
        className={[
          "text-xs px-2 py-1 rounded border font-medium transition shrink-0",
          CRAFTSMANSHIP_STYLE[item.craftsmanship],
          editable ? "cursor-pointer hover:opacity-80" : "cursor-default",
        ].join(" ")}
      >
        {item.craftsmanship}
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

export function CyberneticsTab({ cybernetics, editable, onUpdate }: CyberneticsTabProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [infoTarget, setInfoTarget] = useState<CyberneticItem | null>(null);

  const install = useCallback(
    (ref: CyberneticRef, craftsmanship: CyberneticCraftsmanship, bodyLocation?: ArmourLocationKey[]) => {
      if (!editable) return;
      onUpdate([
        ...cybernetics,
        {
          id: crypto.randomUUID(),
          referenceId: ref.id,
          name: ref.name,
          craftsmanship,
          value: ref.value,
          rarity: ref.rarity,
          source: ref.source,
          ...(bodyLocation ? { bodyLocation } : {}),
        },
      ]);
      setShowPicker(false);
    },
    [editable, cybernetics, onUpdate]
  );

  const cycleQuality = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdate(
        cybernetics.map((c) =>
          c.id === id ? { ...c, craftsmanship: nextCraftsmanship(c.craftsmanship) } : c
        )
      );
    },
    [editable, cybernetics, onUpdate]
  );

  const remove = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdate(cybernetics.filter((c) => c.id !== id));
    },
    [editable, cybernetics, onUpdate]
  );

  return (
    <div className="space-y-6 text-slate-300">
      <h2 className="text-xl font-semibold">Cybernetics</h2>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Installed Implants ({cybernetics.length})
          </h3>
          {editable && (
            <button
              onClick={() => setShowPicker(true)}
              className="text-xs px-3 py-1 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 transition"
            >
              + Install
            </button>
          )}
        </div>

        {cybernetics.length === 0 && (
          <p className="text-sm text-slate-500 italic">No cybernetics installed.</p>
        )}

        {cybernetics.map((item) => (
          <ImplantRow
            key={item.id}
            item={item}
            editable={editable}
            onCycleQuality={cycleQuality}
            onRemove={remove}
            onInfo={setInfoTarget}
          />
        ))}
      </section>

      <p className="text-xs text-slate-600">
        Cost shown is for Common craftsmanship. Click the quality badge to cycle between Poor, Common and Good.
      </p>

      {showPicker && (
        <ImplantPicker
          onSelect={install}
          onClose={() => setShowPicker(false)}
        />
      )}

      {infoTarget && (
        <CyberneticInfoModal
          item={infoTarget}
          onClose={() => setInfoTarget(null)}
        />
      )}
    </div>
  );
}
