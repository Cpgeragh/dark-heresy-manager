// src/pages/characterSheet/CyberneticsTab/ImplantPicker.tsx

import { useState } from "react";
import type { CyberneticCraftsmanship, ArmourLocationKey } from "../../../types/Character";
import {
  CYBERNETICS_REFERENCE,
  type CyberneticRef,
} from "../../../data/reference/cyberneticsReference";
import { rarityColour } from "../../../ui/sourceStyles";
import { PickerModal } from "../../../ui/PickerModal";
import { InfoModal } from "../../../components/InfoModal";
import { CRAFTSMANSHIP_STYLE, LOCATION_DISPLAY } from "./cyberneticsConstants";
import {
  availableCraftsmanship,
  craftsmanshipDescription,
  defaultCraftsmanship,
} from "./cyberneticsHelpers";

interface Props {
  editable?: boolean;
  onSelect: (
    ref: CyberneticRef,
    craftsmanship: CyberneticCraftsmanship,
    bodyLocation?: ArmourLocationKey[]
  ) => void;
  onClose: () => void;
}

export function ImplantPicker({ editable = true, onSelect, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CyberneticRef | null>(null);
  const [location, setLocation] = useState<ArmourLocationKey[] | null>(null);
  const [craftsmanship, setCraftsmanship] = useState<CyberneticCraftsmanship>("Common");

  const filtered = CYBERNETICS_REFERENCE.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  const resetPicker = () => {
    setSelected(null);
    setLocation(null);
    setCraftsmanship("Common");
  };
  const selectImplant = (ref: CyberneticRef) => {
    if (!editable) return;
    setSelected(ref);
    setCraftsmanship(defaultCraftsmanship(ref));
  };
  const implantInfo = (ref: CyberneticRef) => (
    <div className="space-y-3">
      {ref.notes && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            Item Rules
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">{ref.notes}</p>
        </div>
      )}
      {availableCraftsmanship(ref).map((quality) => (
        <div key={quality}>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            {quality}
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">
            {craftsmanshipDescription(ref, quality)}
          </p>
        </div>
      ))}
    </div>
  );

  // ── Step 2: Location picker (arm/leg implants only) ───────────────────────
  if (selected && selected.requiresLocation && !location) {
    const isArm = selected.requiresLocation === "arm";
    const options: { label: string; value: ArmourLocationKey[] }[] = isArm
      ? [
          { label: "Left Arm", value: ["leftArm"] },
          { label: "Right Arm", value: ["rightArm"] },
          { label: "Both Arms", value: ["leftArm", "rightArm"] },
        ]
      : [
          { label: "Left Leg", value: ["leftLeg"] },
          { label: "Right Leg", value: ["rightLeg"] },
          { label: "Both Legs", value: ["leftLeg", "rightLeg"] },
        ];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-500 rounded-xl shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <h3 className="text-sm font-semibold text-slate-200">{selected.name}</h3>
            <button
              onClick={resetPicker}
              className="text-slate-400 hover:text-slate-200 text-lg leading-none"
            >
              ×
            </button>
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
              className="px-4 py-1.5 rounded border border-slate-500 bg-slate-800 hover:bg-slate-700 text-sm text-slate-100"
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
    const qualities = availableCraftsmanship(selected);
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-500 rounded-xl shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <h3 className="text-sm font-semibold text-slate-200">{selected.name}</h3>
            <button
              onClick={resetPicker}
              className="text-slate-400 hover:text-slate-200 text-lg leading-none"
            >
              ×
            </button>
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
                {qualities.map((q) => (
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
              className="px-4 py-1.5 rounded border border-slate-500 bg-slate-800 hover:bg-slate-700 text-sm text-slate-100"
            >
              Back
            </button>
            <button
              onClick={() => onSelect(selected, craftsmanship, location ?? undefined)}
              disabled={!editable}
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
    <PickerModal
      title="Install Cybernetic"
      placeholder="Search implants…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={filtered.length === 0}
    >
      {filtered.map((ref) => (
        <button
          key={ref.id}
          onClick={editable ? () => selectImplant(ref) : undefined}
          className={`w-full text-left px-4 py-3 transition group ${
            editable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className={`text-sm font-medium text-slate-200 truncate ${editable ? "group-hover:text-white" : ""}`}>
                {ref.name}
              </span>
              {(ref.notes || ref.poor || ref.common || ref.good) && (
                <span className="inline-flex items-center leading-[0]" onClick={(e) => e.stopPropagation()}>
                  <InfoModal title={ref.name} content={implantInfo(ref)} />
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0 text-xs">
              <span className="text-amber-400/80 font-mono">₮ {ref.value}</span>
              <span className={rarityColour(ref.rarity)}>{ref.rarity}</span>
            </div>
          </div>
        </button>
      ))}
    </PickerModal>
  );
}
