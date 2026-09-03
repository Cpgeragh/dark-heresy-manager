// src/pages/CharacterSheet/ArcheotechTab/CustomArcheotechForm.tsx

import { useRef, useState } from "react";
import type {
  ArcheotechItem,
  ArmourLocationKey,
  CyberneticCraftsmanship,
} from "../../../types/Character";
import {
  editableInputClass,
  editableTextareaClass,
  uiTextMuted,
  uiFormLabel,
} from "../../../ui/styles/editableStyles";
import { formatWeightInput, sanitizeWeightInput } from "../../../ui/format/weightFormat";
import { formatMoneyInput, sanitizeMoneyInput } from "../../../ui/format/moneyFormat";
import { PickerModal, PickerRow } from "../../../ui/pickers/PickerModal";
import { OptionPickerScreen } from "../../../ui/pickers/OptionPickerScreen";
import { ArrowLeft } from "../../../ui/icons/PickerArrows";
import { ITEM_TYPES, type ItemType } from "./archeotechConstants";
import { EXTENDED_AVAILABILITY_OPTIONS } from "../../../constants/availability";
import { colourSky, colourRose } from "../../../ui/styles/colourTokens";
import { CYBERNETIC_CRAFTSMANSHIP_OPTIONS } from "../../../ui/styles/craftsmanship";
import { ARMOUR_LOCATION_LABELS, ARMOUR_LOCATION_ORDER } from "../../../constants/locations";
import { CustomFormSection } from "../../../ui/forms/CustomFormSection";
import { CustomFormShell } from "../../../ui/forms/CustomFormShell";
import { PickerField } from "../../../ui/pickers/PickerField";
import { RequiredFormLabel } from "../../../ui/forms/RequiredFormLabel";

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

interface Props {
  initialItem?: Partial<ArcheotechItem>;
  title?: string;
  submitLabel?: string;
  onAdd: (item: ArcheotechItem) => void | Promise<void>;
  onCancel: () => void;
  onBack?: () => void;
}

export function CustomArcheotechForm({
  initialItem,
  title = "Custom Archeotech Item",
  submitLabel = "Add Item",
  onAdd,
  onCancel,
  onBack,
}: Props) {
  const formScrollPositionRef = useRef(0);
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
  const [weaponClass, setWeaponClass] = useState<"Ranged" | "Melee" | "">(
    initialItem?.weaponClass ?? ""
  );
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
  const [bodyLocation, setBodyLocation] = useState<ArmourLocationKey[]>(
    initialItem?.bodyLocation ?? []
  );

  // Force Field stats
  const [protectionRating, setProtectionRating] = useState(
    initialItem?.protectionRating !== undefined ? String(initialItem.protectionRating) : ""
  );

  const [saving, setSaving] = useState(false);
  const [showAvailabilityPicker, setShowAvailabilityPicker] = useState(false);
  const [showCraftsmanshipPicker, setShowCraftsmanshipPicker] = useState(false);

  const canAdd = name.trim().length > 0;

  function toggleLocation(loc: ArmourLocationKey) {
    setLocations((prev) => (prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]));
  }

  function toggleBodyLocation(loc: ArmourLocationKey) {
    setBodyLocation((prev) =>
      prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]
    );
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

  // ── Type selector ─────────────────────────────────────────────────────────

  if (phase === "select") {
    return (
      <PickerModal
        title={title}
        query=""
        onQueryChange={() => {}}
        closeLabel={<ArrowLeft />}
        closeAriaLabel="Back"
        onClose={onBack ?? onCancel}
        isEmpty={false}
        hideSearch
        maxHeight="max-h-[92vh]"
      >
        {ITEM_TYPES.map((t) => (
          <PickerRow
            key={t}
            onClick={() => {
              setSelectedType(t);
              setPhase("details");
            }}
          >
            <p className="text-sm lg:text-base font-medium text-slate-200 group-hover:text-white">
              {t}
            </p>
            <p className={`text-xs lg:text-sm ${uiTextMuted} mt-0.5`}>{TYPE_DESCRIPTIONS[t]}</p>
          </PickerRow>
        ))}
      </PickerModal>
    );
  }

  // ── Details form ──────────────────────────────────────────────────────────

  const isWeaponType = selectedType === "Weapon" || selectedType === "Integrated Weapon";
  const isGrenadeType = selectedType === "Grenade" || selectedType === "Mine";
  const showRangedStats = isWeaponType && weaponClass === "Ranged";

  if (showAvailabilityPicker) {
    return (
      <OptionPickerScreen
        title="Rarity"
        options={EXTENDED_AVAILABILITY_OPTIONS}
        selected={availability}
        onSelect={(value) => {
          setAvailability(value);
          setShowAvailabilityPicker(false);
        }}
        onClose={() => setShowAvailabilityPicker(false)}
      />
    );
  }

  if (showCraftsmanshipPicker) {
    return (
      <OptionPickerScreen
        title="Craftsmanship"
        options={[...CYBERNETIC_CRAFTSMANSHIP_OPTIONS]}
        selected={craftsmanship}
        onSelect={(value) => {
          setCraftsmanship(value as CyberneticCraftsmanship);
          setShowCraftsmanshipPicker(false);
        }}
        onClose={() => setShowCraftsmanshipPicker(false)}
      />
    );
  }

  return (
    <CustomFormShell
      title={startType ? title : (selectedType ?? title)}
      scrollPositionRef={formScrollPositionRef}
      titleClassName="text-slate-200"
      closeLabel={startType ? undefined : <ArrowLeft />}
      closeAriaLabel={startType ? "Close" : "Back"}
      onClose={startType ? onCancel : () => setPhase("select")}
      onCancel={onCancel}
      canSubmit={canAdd}
      submitLabel={submitLabel}
      onSubmit={handleAdd}
      saving={saving}
      maxHeight="max-h-[92vh]"
    >
      <>
        <CustomFormSection title="Identity">
          <div>
            <RequiredFormLabel htmlFor="custom-archeotech-name">Name</RequiredFormLabel>
            <input
              id="custom-archeotech-name"
              required
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
              <label htmlFor="custom-archeotech-weight" className={uiFormLabel}>
                Weight
              </label>
              <input
                id="custom-archeotech-weight"
                type="text"
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(sanitizeWeightInput(e.target.value))}
                placeholder="e.g. 2"
                className={editableInputClass(true) + " mt-0.5"}
              />
            </div>
            <div>
              <label htmlFor="custom-archeotech-value" className={uiFormLabel}>
                Value
              </label>
              <input
                id="custom-archeotech-value"
                type="text"
                inputMode="numeric"
                value={value}
                onChange={(e) => setValue(sanitizeMoneyInput(e.target.value))}
                placeholder="e.g. 1000"
                className={editableInputClass(true) + " mt-0.5"}
              />
            </div>
          </div>
          <PickerField
            id="custom-archeotech-rarity"
            label="Rarity"
            supportingText="(optional)"
            value={availability}
            placeholder="Select availability"
            onClick={() => setShowAvailabilityPicker(true)}
          />
        </CustomFormSection>

        {/* Weapon / Integrated Weapon / Grenade / Mine stats */}
        {(isWeaponType || isGrenadeType) && (
          <CustomFormSection title="Stats">
            {isWeaponType && (
              <fieldset>
                <legend className={uiFormLabel}>Class</legend>
                <div className="flex gap-2 mt-0.5">
                  {(["Ranged", "Melee"] as const).map((cls) => (
                    <button
                      type="button"
                      key={cls}
                      aria-pressed={weaponClass === cls}
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
              </fieldset>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="custom-archeotech-damage" className={uiFormLabel}>
                  Damage
                </label>
                <input
                  id="custom-archeotech-damage"
                  type="text"
                  value={damage}
                  onChange={(e) => setDamage(e.target.value)}
                  placeholder="e.g. 1d10+3"
                  className={editableInputClass(true) + " mt-0.5"}
                />
              </div>
              <div>
                <label htmlFor="custom-archeotech-pen" className={uiFormLabel}>
                  Pen
                </label>
                <input
                  id="custom-archeotech-pen"
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
                    <label htmlFor="custom-archeotech-range" className={uiFormLabel}>
                      Range
                    </label>
                    <input
                      id="custom-archeotech-range"
                      type="text"
                      value={range}
                      onChange={(e) => setRange(e.target.value)}
                      placeholder="e.g. 100m"
                      className={editableInputClass(true) + " mt-0.5"}
                    />
                  </div>
                  <div>
                    <label htmlFor="custom-archeotech-rof" className={uiFormLabel}>
                      RoF
                    </label>
                    <input
                      id="custom-archeotech-rof"
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
                    <label htmlFor="custom-archeotech-clip" className={uiFormLabel}>
                      Clip
                    </label>
                    <input
                      id="custom-archeotech-clip"
                      type="text"
                      value={clip}
                      onChange={(e) => setClip(e.target.value)}
                      placeholder="e.g. 30"
                      className={editableInputClass(true) + " mt-0.5"}
                    />
                  </div>
                  <div>
                    <label htmlFor="custom-archeotech-reload" className={uiFormLabel}>
                      Rld
                    </label>
                    <input
                      id="custom-archeotech-reload"
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
              <label htmlFor="custom-archeotech-special-rules" className={uiFormLabel}>
                Special Rules <span className="text-slate-600">(optional)</span>
              </label>
              <input
                id="custom-archeotech-special-rules"
                type="text"
                value={specialRules}
                onChange={(e) => setSpecialRules(e.target.value)}
                placeholder="e.g. Tearing, Accurate"
                className={editableInputClass(true) + " mt-0.5"}
              />
            </div>
          </CustomFormSection>
        )}

        {/* Armour stats */}
        {selectedType === "Armour" && (
          <CustomFormSection title="Stats">
            <div>
              <label htmlFor="custom-archeotech-armour-ap" className={uiFormLabel}>
                AP
              </label>
              <input
                id="custom-archeotech-armour-ap"
                type="text"
                inputMode="numeric"
                value={ap}
                onChange={(e) => setAp(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="e.g. 6"
                className={editableInputClass(true) + " mt-0.5"}
              />
            </div>
            <fieldset>
              <legend className={`${uiFormLabel} block mb-1.5`}>Locations</legend>
              <div className="flex flex-wrap gap-2">
                {ARMOUR_LOCATION_ORDER.map((loc) => (
                  <button
                    type="button"
                    key={loc}
                    aria-pressed={locations.includes(loc)}
                    onClick={() => toggleLocation(loc)}
                    className={[
                      "px-2.5 py-1 rounded border text-xs lg:text-sm font-medium transition",
                      locations.includes(loc)
                        ? "border-red-500/60 bg-red-500/10 text-red-300"
                        : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500",
                    ].join(" ")}
                  >
                    {ARMOUR_LOCATION_LABELS[loc]}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStacks(!stacks)}
                className={[
                  "w-4 h-4 rounded border flex items-center justify-center transition shrink-0",
                  stacks ? "border-red-500 bg-red-500/20" : "border-slate-600 bg-slate-800",
                ].join(" ")}
                aria-label="Stacks with worn armour"
                aria-pressed={stacks}
              >
                {stacks && <span className="text-red-400 text-[10px] leading-none">✓</span>}
              </button>
              <span className="text-xs lg:text-sm text-slate-300">
                Stacks with worn armour{" "}
                <span className={uiTextMuted}>(default: take higher value)</span>
              </span>
            </div>
          </CustomFormSection>
        )}

        {/* Shield stats */}
        {selectedType === "Shield" && (
          <CustomFormSection title="Stats">
            <div>
              <label htmlFor="custom-archeotech-shield-ap" className={uiFormLabel}>
                AP
              </label>
              <input
                id="custom-archeotech-shield-ap"
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
                <label htmlFor="custom-archeotech-shield-damage" className={uiFormLabel}>
                  Damage
                </label>
                <input
                  id="custom-archeotech-shield-damage"
                  type="text"
                  value={damage}
                  onChange={(e) => setDamage(e.target.value)}
                  placeholder="e.g. 1d5"
                  className={editableInputClass(true) + " mt-0.5"}
                />
              </div>
              <div>
                <label htmlFor="custom-archeotech-shield-pen" className={uiFormLabel}>
                  Pen
                </label>
                <input
                  id="custom-archeotech-shield-pen"
                  type="text"
                  value={pen}
                  onChange={(e) => setPen(e.target.value)}
                  placeholder="e.g. 0"
                  className={editableInputClass(true) + " mt-0.5"}
                />
              </div>
            </div>
            <div>
              <label htmlFor="custom-archeotech-shield-special-rules" className={uiFormLabel}>
                Special Rules <span className="text-slate-600">(optional)</span>
              </label>
              <input
                id="custom-archeotech-shield-special-rules"
                type="text"
                value={specialRules}
                onChange={(e) => setSpecialRules(e.target.value)}
                placeholder="e.g. Primitive"
                className={editableInputClass(true) + " mt-0.5"}
              />
            </div>
          </CustomFormSection>
        )}

        {/* Cybernetic stats */}
        {selectedType === "Cybernetic" && (
          <CustomFormSection title="Stats">
            <PickerField
              id="custom-archeotech-craftsmanship"
              label="Craftsmanship"
              supportingText="(optional)"
              value={craftsmanship}
              placeholder="Select craftsmanship"
              onClick={() => setShowCraftsmanshipPicker(true)}
            />
            <fieldset>
              <legend className={`${uiFormLabel} block mb-1.5`}>
                Body Location <span className="text-slate-600">(optional)</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {ARMOUR_LOCATION_ORDER.map((loc) => (
                  <button
                    type="button"
                    key={loc}
                    aria-pressed={bodyLocation.includes(loc)}
                    onClick={() => toggleBodyLocation(loc)}
                    className={[
                      "px-2.5 py-1 rounded border text-xs lg:text-sm font-medium transition",
                      bodyLocation.includes(loc)
                        ? "border-red-500/60 bg-red-500/10 text-red-300"
                        : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500",
                    ].join(" ")}
                  >
                    {ARMOUR_LOCATION_LABELS[loc]}
                  </button>
                ))}
              </div>
            </fieldset>
          </CustomFormSection>
        )}

        {/* Force Field stats */}
        {selectedType === "Force Field" && (
          <CustomFormSection title="Stats">
            <div>
              <label htmlFor="custom-archeotech-protection-rating" className={uiFormLabel}>
                Protection Rating
              </label>
              <input
                id="custom-archeotech-protection-rating"
                type="text"
                inputMode="numeric"
                value={protectionRating}
                onChange={(e) => setProtectionRating(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="e.g. 50"
                className={editableInputClass(true) + " mt-0.5"}
              />
            </div>
          </CustomFormSection>
        )}

        <CustomFormSection title="Rules">
          <div>
            <label htmlFor="custom-archeotech-description" className={uiFormLabel}>
              Description / Rules <span className="text-slate-600">(optional)</span>
            </label>
            <textarea
              id="custom-archeotech-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Rules text, special properties…"
              rows={3}
              className={editableTextareaClass(true) + " mt-0.5"}
            />
          </div>
          <div>
            <label htmlFor="custom-archeotech-notes" className={uiFormLabel}>
              Notes <span className="text-slate-600">(optional)</span>
            </label>
            <textarea
              id="custom-archeotech-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Personal notes, where it was found…"
              rows={2}
              className={editableTextareaClass(true) + " mt-0.5"}
            />
          </div>
        </CustomFormSection>
      </>
    </CustomFormShell>
  );
}
