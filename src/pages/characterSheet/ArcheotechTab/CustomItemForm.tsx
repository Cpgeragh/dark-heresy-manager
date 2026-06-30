// src/pages/characterSheet/ArcheotechTab/CustomItemForm.tsx

import { useState } from "react";
import type { ArcheotechItem, ArmourLocationKey, CyberneticCraftsmanship } from "../../../types/Character";
import {
  editableInputClass,
  editableTextareaClass,
  uiSection,
  uiSectionHeader,
  uiTextMuted,
  uiFormLabel,
} from "../../../ui/editableStyles";
import { uiPickerBackButton } from "../../../ui/buttonStyles";
import { Button } from "../../../ui/Button";
import { formatWeightInput, sanitizeWeightInput } from "../../../ui/weightFormat";
import { formatMoneyInput, sanitizeMoneyInput } from "../../../ui/moneyFormat";
import { PickerModal } from "../../../ui/PickerModal";
import { ITEM_TYPES, AVAILABILITY_OPTIONS, type ItemType } from "./archeotechConstants";
import { colourSky, colourRose } from "../../../ui/colourTokens";
import { LOCATION_LABELS, LOCATION_ORDER } from "../ArmourTab/armourHelpers";

const TYPE_DESCRIPTIONS: Record<ItemType, string> = {
  Weapon: "Ranged or melee weapon",
  Grenade: "Thrown explosive",
  Mine: "Proximity explosive",
  Armour: "Worn protection",
  Cybernetic: "Body implant",
  "Integrated Weapon": "Weapon cybernetic",
  Shield: "Hand-held defence",
  "Force Field": "Energy barrier",
  Device: "Tech device or tool",
  Other: "Miscellaneous item",
};

const CYBERNETIC_CRAFTSMANSHIP_OPTIONS: CyberneticCraftsmanship[] = ["Poor", "Common", "Good"];

interface Props {
  initialItem?: Partial<ArcheotechItem>;
  title?: string;
  submitLabel?: string;
  onAdd: (item: ArcheotechItem) => void | Promise<void>;
  onCancel: () => void;
  onBack?: () => void;
}

export function CustomItemForm({
  initialItem,
  title = "Custom Archeotech Item",
  submitLabel = "Add Item",
  onAdd,
  onCancel,
  onBack,
}: Props) {
  const startType = (initialItem?.type as ItemType | undefined) ?? null;
  const [phase, setPhase] = useState<"select" | "details">(startType ? "details" : "select");
  const [selectedType, setSelectedType] = useState<ItemType | null>(startType);

  // Common fields
  const [name, setName] = useState(initialItem?.name ?? "");
  const [description, setDescription] = useState(initialItem?.description ?? "");
  const [notes, setNotes] = useState(initialItem?.notes ?? "");
  const [weight, setWeight] = useState(initialItem?.weight ?? "");
  const [value, setValue] = useState(initialItem?.value ?? "");
  const [availability, setAvailability] = useState(initialItem?.availability ?? "");

  // Weapon / Integrated Weapon / Grenade / Mine / Shield stats
  const [weaponClass, setWeaponClass] = useState<"Ranged" | "Melee" | "">(initialItem?.weaponClass ?? "");
  const [damage, setDamage] = useState(initialItem?.damage ?? "");
  const [range, setRange] = useState(initialItem?.range ?? "");
  const [rof, setRof] = useState(initialItem?.rof ?? "");
  const [pen, setPen] = useState(initialItem?.pen ?? "");
  const [clip, setClip] = useState(initialItem?.clip ?? "");
  const [rld, setRld] = useState(initialItem?.rld ?? "");
  const [specialRules, setSpecialRules] = useState(initialItem?.specialRules ?? "");

  // Armour / Shield stats
  const [ap, setAp] = useState(initialItem?.ap !== undefined ? String(initialItem.ap) : "");
  const [locations, setLocations] = useState<ArmourLocationKey[]>(initialItem?.locations ?? []);
  const [stacks, setStacks] = useState(initialItem?.stacks ?? false);

  // Cybernetic stats
  const [craftsmanship, setCraftsmanship] = useState<CyberneticCraftsmanship | "">(
    initialItem?.craftsmanship ?? ""
  );
  const [bodyLocation, setBodyLocation] = useState<ArmourLocationKey[]>(initialItem?.bodyLocation ?? []);

  // Force Field stats
  const [protectionRating, setProtectionRating] = useState(
    initialItem?.protectionRating !== undefined ? String(initialItem.protectionRating) : ""
  );

  const [saving, setSaving] = useState(false);

  const canAdd = name.trim().length > 0;

  function toggleLocation(loc: ArmourLocationKey) {
    setLocations((prev) => (prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]));
  }

  function toggleBodyLocation(loc: ArmourLocationKey) {
    setBodyLocation((prev) => (prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]));
  }

  async function handleAdd() {
    if (!canAdd || !selectedType) return;
    setSaving(true);
    try {
      const item: ArcheotechItem = {
        id: initialItem?.id ?? crypto.randomUUID(),
        name: name.trim(),
        type: selectedType,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        weight: formatWeightInput(weight),
        value: formatMoneyInput(value),
        availability: availability || undefined,
        customLibraryId: initialItem?.customLibraryId,
        customLibraryVersionId: initialItem?.customLibraryVersionId,
        equipped: initialItem?.equipped,
      };

      if (selectedType === "Weapon" || selectedType === "Integrated Weapon") {
        if (weaponClass) item.weaponClass = weaponClass;
        if (damage.trim()) item.damage = damage.trim();
        if (pen.trim()) item.pen = pen.trim();
        if (specialRules.trim()) item.specialRules = specialRules.trim();
        if (weaponClass === "Ranged") {
          if (range.trim()) item.range = range.trim();
          if (rof.trim()) item.rof = rof.trim();
          if (clip.trim()) item.clip = clip.trim();
          if (rld.trim()) item.rld = rld.trim();
        }
      }

      if (selectedType === "Grenade" || selectedType === "Mine") {
        if (damage.trim()) item.damage = damage.trim();
        if (pen.trim()) item.pen = pen.trim();
        if (specialRules.trim()) item.specialRules = specialRules.trim();
      }

      if (selectedType === "Armour") {
        const apNum = parseInt(ap, 10);
        if (!isNaN(apNum)) item.ap = apNum;
        if (locations.length > 0) item.locations = locations;
        item.stacks = stacks;
      }

      if (selectedType === "Shield") {
        const apNum = parseInt(ap, 10);
        if (!isNaN(apNum)) item.ap = apNum;
        if (damage.trim()) item.damage = damage.trim();
        if (pen.trim()) item.pen = pen.trim();
        if (specialRules.trim()) item.specialRules = specialRules.trim();
      }

      if (selectedType === "Cybernetic") {
        if (craftsmanship) item.craftsmanship = craftsmanship;
        if (bodyLocation.length > 0) item.bodyLocation = bodyLocation;
      }

      if (selectedType === "Force Field") {
        const pr = parseInt(protectionRating, 10);
        if (!isNaN(pr)) item.protectionRating = pr;
      }

      await onAdd(item);
    } finally {
      setSaving(false);
    }
  }

  // ── Phase 1: type selector ─────────────────────────────────────────────────

  if (phase === "select") {
    return (
      <PickerModal
        title={title}
        query=""
        onQueryChange={() => {}}
        closeLabel="←"
        onClose={onBack ?? onCancel}
        isEmpty={false}
        hideSearch
        maxHeight="max-h-[92vh]"
      >
        {ITEM_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => {
              setSelectedType(t);
              setPhase("details");
            }}
            className="w-full text-left px-4 lg:px-5 py-3 lg:py-4 transition group hover:bg-slate-800 cursor-pointer"
          >
            <p className="text-sm lg:text-base font-medium text-slate-200 group-hover:text-white">{t}</p>
            <p className={`text-xs lg:text-sm ${uiTextMuted} mt-0.5`}>{TYPE_DESCRIPTIONS[t]}</p>
          </button>
        ))}
      </PickerModal>
    );
  }

  // ── Phase 2: details form ──────────────────────────────────────────────────

  const isWeaponType = selectedType === "Weapon" || selectedType === "Integrated Weapon";
  const isGrenadeType = selectedType === "Grenade" || selectedType === "Mine";
  const showRangedStats = isWeaponType && weaponClass === "Ranged";

  return (
    <PickerModal
      title={selectedType ?? title}
      titleClassName="text-slate-200"
      closeLabel={startType ? undefined : "←"}
      query=""
      onQueryChange={() => {}}
      onClose={startType ? onCancel : () => setPhase("select")}
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
              className={uiPickerBackButton}
            >
              Cancel
            </button>
          </div>
        </div>
      }
    >
      <div className="p-4 lg:p-5 space-y-4">
        {/* Identity */}
        <p className={uiSectionHeader}>Identity</p>
        <div className={uiSection + " space-y-3"}>
          <div>
            <label className={uiFormLabel}>
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
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={uiFormLabel}>
                Weight
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(sanitizeWeightInput(e.target.value))}
                placeholder="e.g. 2"
                className={editableInputClass(true) + " mt-0.5"}
              />
            </div>
            <div>
              <label className={uiFormLabel}>
                Value
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={value}
                onChange={(e) => setValue(sanitizeMoneyInput(e.target.value))}
                placeholder="e.g. 1000"
                className={editableInputClass(true) + " mt-0.5"}
              />
            </div>
          </div>
          <div>
            <label className={uiFormLabel}>
              Rarity <span className="text-slate-600">(optional)</span>
            </label>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className={editableInputClass(true) + " mt-0.5 appearance-none"}
            >
              <option value="">— Select availability —</option>
              {AVAILABILITY_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Weapon / Integrated Weapon / Grenade / Mine stats */}
        {(isWeaponType || isGrenadeType) && (
          <>
            <p className={uiSectionHeader}>Stats</p>
            <div className={uiSection + " space-y-3"}>
              {isWeaponType && (
                <div>
                  <label className={uiFormLabel}>
                    Class
                  </label>
                  <div className="flex gap-2 mt-0.5">
                    {(["Ranged", "Melee"] as const).map((cls) => (
                      <button
                        key={cls}
                        onClick={() => setWeaponClass(weaponClass === cls ? "" : cls)}
                        className={[
                          "flex-1 py-1.5 rounded border text-sm lg:text-base font-medium transition",
                          weaponClass === cls
                            ? cls === "Ranged"
                              ? colourSky
                              : colourRose
                            : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500",
                        ].join(" ")}
                      >
                        {cls}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={uiFormLabel}>
                    Damage
                  </label>
                  <input
                    type="text"
                    value={damage}
                    onChange={(e) => setDamage(e.target.value)}
                    placeholder="e.g. 1d10+3"
                    className={editableInputClass(true) + " mt-0.5"}
                  />
                </div>
                <div>
                  <label className={uiFormLabel}>
                    Pen
                  </label>
                  <input
                    type="text"
                    value={pen}
                    onChange={(e) => setPen(e.target.value)}
                    placeholder="e.g. 4"
                    className={editableInputClass(true) + " mt-0.5"}
                  />
                </div>
              </div>
              {showRangedStats && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={uiFormLabel}>
                        Range
                      </label>
                      <input
                        type="text"
                        value={range}
                        onChange={(e) => setRange(e.target.value)}
                        placeholder="e.g. 100m"
                        className={editableInputClass(true) + " mt-0.5"}
                      />
                    </div>
                    <div>
                      <label className={uiFormLabel}>
                        RoF
                      </label>
                      <input
                        type="text"
                        value={rof}
                        onChange={(e) => setRof(e.target.value)}
                        placeholder="e.g. S/2/5"
                        className={editableInputClass(true) + " mt-0.5"}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={uiFormLabel}>
                        Clip
                      </label>
                      <input
                        type="text"
                        value={clip}
                        onChange={(e) => setClip(e.target.value)}
                        placeholder="e.g. 30"
                        className={editableInputClass(true) + " mt-0.5"}
                      />
                    </div>
                    <div>
                      <label className={uiFormLabel}>
                        Rld
                      </label>
                      <input
                        type="text"
                        value={rld}
                        onChange={(e) => setRld(e.target.value)}
                        placeholder="e.g. Full"
                        className={editableInputClass(true) + " mt-0.5"}
                      />
                    </div>
                  </div>
                </>
              )}
              <div>
                <label className={uiFormLabel}>
                  Special Rules <span className="text-slate-600">(optional)</span>
                </label>
                <input
                  type="text"
                  value={specialRules}
                  onChange={(e) => setSpecialRules(e.target.value)}
                  placeholder="e.g. Tearing, Accurate"
                  className={editableInputClass(true) + " mt-0.5"}
                />
              </div>
            </div>
          </>
        )}

        {/* Armour stats */}
        {selectedType === "Armour" && (
          <>
            <p className={uiSectionHeader}>Stats</p>
            <div className={uiSection + " space-y-3"}>
              <div>
                <label className={uiFormLabel}>
                  AP
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={ap}
                  onChange={(e) => setAp(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="e.g. 6"
                  className={editableInputClass(true) + " mt-0.5"}
                />
              </div>
              <div>
                <label className={`${uiFormLabel} block mb-1.5`}>
                  Locations
                </label>
                <div className="flex flex-wrap gap-2">
                  {LOCATION_ORDER.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => toggleLocation(loc)}
                      className={[
                        "px-2.5 py-1 rounded border text-xs lg:text-sm font-medium transition",
                        locations.includes(loc)
                          ? "border-red-500/60 bg-red-500/10 text-red-300"
                          : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500",
                      ].join(" ")}
                    >
                      {LOCATION_LABELS[loc]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStacks(!stacks)}
                  className={[
                    "w-4 h-4 rounded border flex items-center justify-center transition shrink-0",
                    stacks ? "border-red-500 bg-red-500/20" : "border-slate-600 bg-slate-800",
                  ].join(" ")}
                  aria-label="Stacks with worn armour"
                >
                  {stacks && <span className="text-red-400 text-[10px] leading-none">✓</span>}
                </button>
                <span className="text-xs lg:text-sm text-slate-300">
                  Stacks with worn armour <span className={uiTextMuted}>(default: take higher value)</span>
                </span>
              </div>
            </div>
          </>
        )}

        {/* Shield stats */}
        {selectedType === "Shield" && (
          <>
            <p className={uiSectionHeader}>Stats</p>
            <div className={uiSection + " space-y-3"}>
              <div>
                <label className={uiFormLabel}>
                  AP
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={ap}
                  onChange={(e) => setAp(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="e.g. 4"
                  className={editableInputClass(true) + " mt-0.5"}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={uiFormLabel}>
                    Damage
                  </label>
                  <input
                    type="text"
                    value={damage}
                    onChange={(e) => setDamage(e.target.value)}
                    placeholder="e.g. 1d5"
                    className={editableInputClass(true) + " mt-0.5"}
                  />
                </div>
                <div>
                  <label className={uiFormLabel}>
                    Pen
                  </label>
                  <input
                    type="text"
                    value={pen}
                    onChange={(e) => setPen(e.target.value)}
                    placeholder="e.g. 0"
                    className={editableInputClass(true) + " mt-0.5"}
                  />
                </div>
              </div>
              <div>
                <label className={uiFormLabel}>
                  Special Rules <span className="text-slate-600">(optional)</span>
                </label>
                <input
                  type="text"
                  value={specialRules}
                  onChange={(e) => setSpecialRules(e.target.value)}
                  placeholder="e.g. Primitive"
                  className={editableInputClass(true) + " mt-0.5"}
                />
              </div>
            </div>
          </>
        )}

        {/* Cybernetic stats */}
        {selectedType === "Cybernetic" && (
          <>
            <p className={uiSectionHeader}>Stats</p>
            <div className={uiSection + " space-y-3"}>
              <div>
                <label className={uiFormLabel}>
                  Craftsmanship <span className="text-slate-600">(optional)</span>
                </label>
                <select
                  value={craftsmanship}
                  onChange={(e) => setCraftsmanship(e.target.value as CyberneticCraftsmanship | "")}
                  className={editableInputClass(true) + " mt-0.5 appearance-none"}
                >
                  <option value="">— Select —</option>
                  {CYBERNETIC_CRAFTSMANSHIP_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`${uiFormLabel} block mb-1.5`}>
                  Body Location <span className="text-slate-600">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {LOCATION_ORDER.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => toggleBodyLocation(loc)}
                      className={[
                        "px-2.5 py-1 rounded border text-xs lg:text-sm font-medium transition",
                        bodyLocation.includes(loc)
                          ? "border-red-500/60 bg-red-500/10 text-red-300"
                          : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500",
                      ].join(" ")}
                    >
                      {LOCATION_LABELS[loc]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Force Field stats */}
        {selectedType === "Force Field" && (
          <>
            <p className={uiSectionHeader}>Stats</p>
            <div className={uiSection + " space-y-3"}>
              <div>
                <label className={uiFormLabel}>
                  Protection Rating
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={protectionRating}
                  onChange={(e) => setProtectionRating(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="e.g. 50"
                  className={editableInputClass(true) + " mt-0.5"}
                />
              </div>
            </div>
          </>
        )}

        {/* Rules */}
        <p className={uiSectionHeader}>Rules</p>
        <div className={uiSection + " space-y-3"}>
          <div>
            <label className={uiFormLabel}>
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
            <label className={uiFormLabel}>
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
