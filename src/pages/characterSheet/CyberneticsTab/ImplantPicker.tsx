// src/pages/characterSheet/CyberneticsTab/ImplantPicker.tsx

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { CyberneticCraftsmanship, ArmourLocationKey } from "../../../types/Character";
import {
  CYBERNETICS_REFERENCE,
  type CyberneticRef,
} from "../../../data/reference/cyberneticsReference";
import { PickerModal } from "../../../ui/PickerModal";
import { Button } from "../../../ui/Button";
import { InfoModal } from "../../../components/InfoModal";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { editableInputClass, uiTextBody, uiTextLabel, uiTextMuted } from "../../../ui/editableStyles";
import { formatMoneyInput, sanitizeMoneyInput } from "../../../ui/moneyFormat";
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
    bodyLocation?: ArmourLocationKey[],
    gmValue?: string,
    gmRarity?: string
  ) => void;
  onClose: () => void;
}

const RARITY_OPTIONS = [
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

export function ImplantPicker({ editable = true, onSelect, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CyberneticRef | null>(null);
  const [pendingCost, setPendingCost] = useState<CyberneticRef | null>(null);
  const [location, setLocation] = useState<ArmourLocationKey[] | null>(null);
  const [craftsmanship, setCraftsmanship] = useState<CyberneticCraftsmanship>("Common");
  const [gmCost, setGmCost] = useState("");
  const [gmRarity, setGmRarity] = useState("");
  const [assignedValue, setAssignedValue] = useState<string | undefined>();
  const [assignedRarity, setAssignedRarity] = useState<string | undefined>();

  const filtered = CYBERNETICS_REFERENCE.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  const step = pendingCost ? "cost"
    : (selected && selected.requiresLocation && !location) ? "location"
    : selected ? "craft"
    : "list";

  const dialogRef = useRef<HTMLDialogElement | null>(null);
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    d.showModal();
    return () => { if (d.open) d.close(); };
  }, [step]);

  const resetPicker = () => {
    setSelected(null);
    setPendingCost(null);
    setLocation(null);
    setCraftsmanship("Common");
    setGmCost("");
    setGmRarity("");
    setAssignedValue(undefined);
    setAssignedRarity(undefined);
  };
  const selectImplant = (ref: CyberneticRef) => {
    if (!editable) return;
    if (isVariableMeta(ref.value) || isVariableMeta(ref.rarity)) {
      setPendingCost(ref);
      setGmCost("");
      setGmRarity("");
      return;
    }
    setSelected(ref);
    setCraftsmanship(defaultCraftsmanship(ref));
  };
  const costNum = Number(gmCost);
  const costValid = gmCost.trim() !== "" && Number.isInteger(costNum) && costNum >= 0;
  const pendingNeedsRarity = pendingCost ? isVariableMeta(pendingCost.rarity) : false;
  const canConfirmCost = costValid && (!pendingNeedsRarity || gmRarity !== "");
  const confirmCost = () => {
    if (!pendingCost || !canConfirmCost) return;
    setAssignedValue(formatMoneyInput(gmCost));
    setAssignedRarity(pendingNeedsRarity ? gmRarity : undefined);
    setSelected(pendingCost);
    setPendingCost(null);
    setCraftsmanship(defaultCraftsmanship(pendingCost));
  };
  const implantInfo = (ref: CyberneticRef) => (
    <div className="space-y-3">
      {ref.notes && (
        <div>
          <p className={`${uiTextLabel} font-semibold mb-1`}>
            Item Rules
          </p>
          <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{ref.notes}</p>
        </div>
      )}
      {availableCraftsmanship(ref).map((quality) => (
        <div key={quality}>
          <p className={`${uiTextLabel} font-semibold mb-1`}>
            {quality}
          </p>
          <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>
            {craftsmanshipDescription(ref, quality)}
          </p>
        </div>
      ))}
    </div>
  );

  if (pendingCost) {
    return createPortal(
      <dialog
        ref={dialogRef}
        onClose={resetPicker}
        onClick={(e) => { if (e.target === dialogRef.current) resetPicker(); }}
        className="m-auto w-[calc(100%-2rem)] max-w-md lg:max-w-lg bg-slate-900 border border-slate-500 rounded-xl shadow-2xl p-0 backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        <div className="flex items-center justify-between px-4 lg:px-5 py-3 lg:py-4 border-b border-slate-700">
          <h3 className="text-sm lg:text-base font-semibold text-slate-200">Assigned Cost</h3>
          <button onClick={resetPicker} className="text-slate-400 hover:text-slate-200 text-lg leading-none">×</button>
        </div>

        <div className="px-4 lg:px-5 py-4 lg:py-5 space-y-4">
          <p className={`text-sm lg:text-base ${uiTextBody}`}>
            <span className="font-medium text-slate-200">{pendingCost.name}</span> has no listed
            cost or availability. Enter the values assigned for this implant.
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
              placeholder="e.g. 5000"
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
                <option value="">— Select rarity —</option>
                {RARITY_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="px-4 lg:px-5 py-3 lg:py-4 border-t border-slate-700 flex gap-2">
          <button onClick={resetPicker} className="px-4 lg:px-5 py-1.5 lg:py-2 rounded border border-slate-500 bg-slate-800 hover:bg-slate-700 text-sm lg:text-base text-slate-100">
            Back
          </button>
          <Button className="flex-1" onClick={confirmCost} disabled={!canConfirmCost}>
            Continue
          </Button>
        </div>
      </dialog>,
      document.body
    );
  }

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

    return createPortal(
      <dialog
        ref={dialogRef}
        onClose={resetPicker}
        onClick={(e) => { if (e.target === dialogRef.current) resetPicker(); }}
        className="m-auto w-[calc(100%-2rem)] max-w-md lg:max-w-lg bg-slate-900 border border-slate-500 rounded-xl shadow-2xl p-0 backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        <div className="flex items-center justify-between px-4 lg:px-5 py-3 lg:py-4 border-b border-slate-700">
          <h3 className="text-sm lg:text-base font-semibold text-slate-200">{selected.name}</h3>
          <button onClick={resetPicker} className="text-slate-400 hover:text-slate-200 text-lg leading-none">×</button>
        </div>

        <div className="px-4 lg:px-5 py-4 lg:py-5 space-y-3">
          <p className={`text-xs lg:text-sm ${uiTextMuted}`}>Select installation side:</p>
          <div className="flex flex-col gap-2">
            {options.map((opt) => (
              <button
                key={opt.label}
                onClick={() => setLocation(opt.value)}
                className="py-2 lg:py-2.5 px-3 lg:px-4 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 text-sm lg:text-base text-slate-200 text-left transition"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 lg:px-5 py-3 lg:py-4 border-t border-slate-700">
          <button onClick={resetPicker} className="px-4 lg:px-5 py-1.5 lg:py-2 rounded border border-slate-500 bg-slate-800 hover:bg-slate-700 text-sm lg:text-base text-slate-100">
            Back
          </button>
        </div>
      </dialog>,
      document.body
    );
  }

  // ── Step 3: Craftsmanship picker ──────────────────────────────────────────
  if (selected) {
    const qualities = availableCraftsmanship(selected);
    return createPortal(
      <dialog
        ref={dialogRef}
        onClose={resetPicker}
        onClick={(e) => { if (e.target === dialogRef.current) resetPicker(); }}
        className="m-auto w-[calc(100%-2rem)] max-w-md lg:max-w-lg bg-slate-900 border border-slate-500 rounded-xl shadow-2xl p-0 backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        <div className="flex items-center justify-between px-4 lg:px-5 py-3 lg:py-4 border-b border-slate-700">
          <h3 className="text-sm lg:text-base font-semibold text-slate-200">{selected.name}</h3>
          <button onClick={resetPicker} className="text-slate-400 hover:text-slate-200 text-lg leading-none">×</button>
        </div>

        <div className="px-4 lg:px-5 py-4 lg:py-5 space-y-4">
          {location && (
            <div className={`flex items-center gap-2 text-xs lg:text-sm ${uiTextMuted}`}>
              <span>Installing on:</span>
              <span className="px-2 lg:px-3 py-0.5 rounded border border-slate-600 bg-slate-800 text-slate-300">
                {location.map((l) => LOCATION_DISPLAY[l]).join(" & ")}
              </span>
            </div>
          )}

          <div>
            <p className={`text-xs lg:text-sm ${uiTextMuted} mb-2`}>Select craftsmanship quality:</p>
            <div className="flex gap-2">
              {qualities.map((q) => (
                <button
                  key={q}
                  onClick={() => setCraftsmanship(q)}
                  className={[
                    "flex-1 py-1.5 lg:py-2 rounded border text-sm lg:text-base font-medium transition",
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

          <div className={`text-xs lg:text-sm ${uiTextBody} bg-slate-800/60 rounded p-3 lg:p-4 leading-relaxed`}>
            {craftsmanshipDescription(selected, craftsmanship)}
          </div>
        </div>

        <div className="px-4 lg:px-5 py-3 lg:py-4 border-t border-slate-700 flex gap-2">
          <button onClick={resetPicker} className="px-4 lg:px-5 py-1.5 lg:py-2 rounded border border-slate-500 bg-slate-800 hover:bg-slate-700 text-sm lg:text-base text-slate-100">
            Back
          </button>
          <Button
            className="flex-1"
            onClick={() => onSelect(selected, craftsmanship, location ?? undefined, assignedValue, assignedRarity)}
            disabled={!editable}
          >
            Install
          </Button>
        </div>
      </dialog>,
      document.body
    );
  }

  // ── Step 1: Search list ───────────────────────────────────────────────────
  return (
    <PickerModal
      title={editable ? "Add Cybernetic" : "View Cybernetics"}
      placeholder="Search implants…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={filtered.length === 0}
    >
      {filtered.map((ref) => (
        <div
          key={ref.id}
          role="button"
          tabIndex={editable ? 0 : -1}
          onClick={editable ? () => selectImplant(ref) : undefined}
          className={`w-full text-left px-4 lg:px-5 py-3 lg:py-4 transition group ${
            editable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className={`text-sm lg:text-base font-medium text-slate-200 truncate ${editable ? "group-hover:text-white" : ""}`}>
                {ref.name}
              </span>
              {(ref.notes || ref.poor || ref.common || ref.good) && (
                <span className="inline-flex items-center -translate-y-[1.4px]" onClick={(e) => e.stopPropagation()}>
                  <InfoModal title={ref.name} content={implantInfo(ref)} />
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0 text-xs lg:text-sm">
              <ItemMetaChips
                bare
                value={isVariableMeta(ref.value) ? undefined : ref.value}
                rarity={isVariableMeta(ref.rarity) ? undefined : ref.rarity}
                source={ref.source}
                valueAmber
              />
              {(isVariableMeta(ref.value) || isVariableMeta(ref.rarity)) && (
                <span className="text-amber-400/70 italic">Cost assigned on add</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </PickerModal>
  );
}
