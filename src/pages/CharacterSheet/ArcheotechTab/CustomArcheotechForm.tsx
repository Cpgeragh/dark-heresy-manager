// src/pages/CharacterSheet/ArcheotechTab/CustomArcheotechForm.tsx

import { useRef, useState } from "react";
import type {
  ArcheotechItem,
  ArmourLocationKey,
  CyberneticCraftsmanship,
} from "../../../types/Character";
import {
  uiInlineRow,
  uiTwoColumnGrid,
  editableInputClass,
  editableTextareaClass,
  uiTextBody,
} from "../../../ui/styles/editableStyles";
import { formatWeightInput, sanitizeWeightInput } from "../../../ui/format/weightFormat";
import { formatMoneyInput, sanitizeMoneyInput } from "../../../ui/format/moneyFormat";
import { PickerList, PickerModal, PickerRow } from "../../../ui/pickers/PickerModal";
import { PickerRowName, PickerRowText } from "../../../ui/pickers/PickerRowParts";
import { OptionPickerScreen } from "../../../ui/pickers/OptionPickerScreen";
import { ArrowLeft } from "../../../ui/icons/PickerArrows";
import { CheckIcon } from "../../../ui/icons/CheckIcon";
import { ITEM_TYPES, type ItemType } from "./archeotechConstants";
import { EXTENDED_AVAILABILITY_OPTIONS } from "../../../constants/availability";
import {
  chipColours,
  colourControlSurface,
  colourToggleSelected,
  colourErrorText,
  colourStateRed,
} from "../../../ui/styles/colourTokens";
import { ToggleButton } from "../../../ui/buttons/ToggleButton";
import { CYBERNETIC_CRAFTSMANSHIP_OPTIONS } from "../../../ui/styles/craftsmanship";
import { ARMOUR_LOCATION_LABELS, ARMOUR_LOCATION_ORDER } from "../../../constants/locations";
import { CustomFormSection } from "../../../ui/forms/CustomFormSection";
import { DescriptionAndRulesFields } from "../../../ui/forms/DescriptionAndRulesFields";
import { CustomFormShell } from "../../../ui/forms/CustomFormShell";
import { PickerField } from "../../../ui/pickers/PickerField";
import { FormLabel } from "../../../ui/forms/FormLabel";
import { uiFocusRing, uiPressFeedback } from "../../../ui/styles/buttonStyles";
import { uiCornerSmall } from "../../../ui/styles/shapeStyles";

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
  const [rules, setRules] = useState(initialItem?.rules ?? "");
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
        rules: rules.trim() || undefined,
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
        <PickerList>
          {ITEM_TYPES.map((t) => (
            <PickerRow
              key={t}
              opensScreen
              onClick={() => {
                setSelectedType(t);
                setPhase("details");
              }}
            >
              <PickerRowName name={t} />
              <PickerRowText>{TYPE_DESCRIPTIONS[t]}</PickerRowText>
            </PickerRow>
          ))}
        </PickerList>
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
            <FormLabel htmlFor="custom-archeotech-name" required>
              Name
            </FormLabel>
            <input
              id="custom-archeotech-name"
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Item name…"
              className={editableInputClass(true) + " mt-0.5"}
              autoFocus
              autoComplete="off"
            />
          </div>
          <div className={uiTwoColumnGrid}>
            <div>
              <FormLabel htmlFor="custom-archeotech-weight">Weight</FormLabel>
              <input
                id="custom-archeotech-weight"
                type="text"
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(sanitizeWeightInput(e.target.value))}
                placeholder="e.g. 2"
                className={editableInputClass(true) + " mt-0.5"}
                autoComplete="off"
              />
            </div>
            <div>
              <FormLabel htmlFor="custom-archeotech-value">Value</FormLabel>
              <input
                id="custom-archeotech-value"
                type="text"
                inputMode="numeric"
                value={value}
                onChange={(e) => setValue(sanitizeMoneyInput(e.target.value))}
                placeholder="e.g. 1000"
                className={editableInputClass(true) + " mt-0.5"}
                autoComplete="off"
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
                <FormLabel as="legend">Class</FormLabel>
                <div className="flex gap-2 mt-0.5">
                  {(["Ranged", "Melee"] as const).map((cls) => (
                    <ToggleButton
                      key={cls}
                      selected={weaponClass === cls}
                      selectedClassName={cls === "Ranged" ? chipColours.sky : chipColours.rose}
                      className="flex-1 py-1.5 text-sm lg:text-base font-medium"
                      onClick={() => setWeaponClass(weaponClass === cls ? "" : cls)}
                    >
                      {cls}
                    </ToggleButton>
                  ))}
                </div>
              </fieldset>
            )}
            <div className={uiTwoColumnGrid}>
              <div>
                <FormLabel htmlFor="custom-archeotech-damage">Damage</FormLabel>
                <input
                  id="custom-archeotech-damage"
                  type="text"
                  value={damage}
                  onChange={(e) => setDamage(e.target.value)}
                  placeholder="e.g. 1d10+3"
                  className={editableInputClass(true) + " mt-0.5"}
                  autoComplete="off"
                />
              </div>
              <div>
                <FormLabel htmlFor="custom-archeotech-pen">Pen</FormLabel>
                <input
                  id="custom-archeotech-pen"
                  type="text"
                  value={pen}
                  onChange={(e) => setPen(e.target.value)}
                  placeholder="e.g. 4"
                  className={editableInputClass(true) + " mt-0.5"}
                  autoComplete="off"
                />
              </div>
            </div>
            {showRangedStats && (
              <>
                <div className={uiTwoColumnGrid}>
                  <div>
                    <FormLabel htmlFor="custom-archeotech-range">Range</FormLabel>
                    <input
                      id="custom-archeotech-range"
                      type="text"
                      value={range}
                      onChange={(e) => setRange(e.target.value)}
                      placeholder="e.g. 100m"
                      className={editableInputClass(true) + " mt-0.5"}
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <FormLabel htmlFor="custom-archeotech-rof">RoF</FormLabel>
                    <input
                      id="custom-archeotech-rof"
                      type="text"
                      value={rof}
                      onChange={(e) => setRof(e.target.value)}
                      placeholder="e.g. S/2/5"
                      className={editableInputClass(true) + " mt-0.5"}
                      autoComplete="off"
                    />
                  </div>
                </div>
                <div className={uiTwoColumnGrid}>
                  <div>
                    <FormLabel htmlFor="custom-archeotech-clip">Clip</FormLabel>
                    <input
                      id="custom-archeotech-clip"
                      type="text"
                      value={clip}
                      onChange={(e) => setClip(e.target.value)}
                      placeholder="e.g. 30"
                      className={editableInputClass(true) + " mt-0.5"}
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <FormLabel htmlFor="custom-archeotech-reload">Rld</FormLabel>
                    <input
                      id="custom-archeotech-reload"
                      type="text"
                      value={rld}
                      onChange={(e) => setRld(e.target.value)}
                      placeholder="e.g. Full"
                      className={editableInputClass(true) + " mt-0.5"}
                      autoComplete="off"
                    />
                  </div>
                </div>
              </>
            )}
            <div>
              <FormLabel htmlFor="custom-archeotech-special-rules" supportingText="(optional)">
                Qualities
              </FormLabel>
              <input
                id="custom-archeotech-special-rules"
                type="text"
                value={specialRules}
                onChange={(e) => setSpecialRules(e.target.value)}
                placeholder="e.g. Tearing, Accurate"
                className={editableInputClass(true) + " mt-0.5"}
                autoComplete="off"
              />
            </div>
          </CustomFormSection>
        )}

        {/* Armour stats */}
        {selectedType === "Armour" && (
          <CustomFormSection title="Stats">
            <div>
              <FormLabel htmlFor="custom-archeotech-armour-ap">AP</FormLabel>
              <input
                id="custom-archeotech-armour-ap"
                type="text"
                inputMode="numeric"
                value={ap}
                onChange={(e) => setAp(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="e.g. 6"
                className={editableInputClass(true) + " mt-0.5"}
                autoComplete="off"
              />
            </div>
            <fieldset>
              <FormLabel as="legend" className="block mb-1.5">
                Locations
              </FormLabel>
              <div className="flex flex-wrap gap-2">
                {ARMOUR_LOCATION_ORDER.map((loc) => (
                  <ToggleButton
                    key={loc}
                    selected={locations.includes(loc)}
                    selectedClassName={colourToggleSelected.red}
                    className="px-2.5 py-1 text-xs lg:text-sm font-medium"
                    onClick={() => toggleLocation(loc)}
                  >
                    {ARMOUR_LOCATION_LABELS[loc]}
                  </ToggleButton>
                ))}
              </div>
            </fieldset>
            <div className={`${uiInlineRow}`}>
              <button
                type="button"
                onClick={() => setStacks(!stacks)}
                className={[
                  `w-4 h-4 ${uiCornerSmall} border flex items-center justify-center transition shrink-0 ${uiPressFeedback()} ${uiFocusRing}`,
                  stacks ? colourStateRed : colourControlSurface,
                ].join(" ")}
                aria-label="Stacks with worn armour"
                aria-pressed={stacks}
              >
                {stacks && <CheckIcon className={`h-[10px] w-[10px] ${colourErrorText}`} />}
              </button>
              <span className={`text-xs lg:text-sm ${uiTextBody}`}>
                Stacks with worn armour{" "}
                <span className={uiTextBody}>(default: take higher value)</span>
              </span>
            </div>
          </CustomFormSection>
        )}

        {/* Shield stats */}
        {selectedType === "Shield" && (
          <CustomFormSection title="Stats">
            <div>
              <FormLabel htmlFor="custom-archeotech-shield-ap">AP</FormLabel>
              <input
                id="custom-archeotech-shield-ap"
                type="text"
                inputMode="numeric"
                value={ap}
                onChange={(e) => setAp(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="e.g. 4"
                className={editableInputClass(true) + " mt-0.5"}
                autoComplete="off"
              />
            </div>
            <div className={uiTwoColumnGrid}>
              <div>
                <FormLabel htmlFor="custom-archeotech-shield-damage">Damage</FormLabel>
                <input
                  id="custom-archeotech-shield-damage"
                  type="text"
                  value={damage}
                  onChange={(e) => setDamage(e.target.value)}
                  placeholder="e.g. 1d5"
                  className={editableInputClass(true) + " mt-0.5"}
                  autoComplete="off"
                />
              </div>
              <div>
                <FormLabel htmlFor="custom-archeotech-shield-pen">Pen</FormLabel>
                <input
                  id="custom-archeotech-shield-pen"
                  type="text"
                  value={pen}
                  onChange={(e) => setPen(e.target.value)}
                  placeholder="e.g. 0"
                  className={editableInputClass(true) + " mt-0.5"}
                  autoComplete="off"
                />
              </div>
            </div>
            <div>
              <FormLabel
                htmlFor="custom-archeotech-shield-special-rules"
                supportingText="(optional)"
              >
                Qualities
              </FormLabel>
              <input
                id="custom-archeotech-shield-special-rules"
                type="text"
                value={specialRules}
                onChange={(e) => setSpecialRules(e.target.value)}
                placeholder="e.g. Primitive"
                className={editableInputClass(true) + " mt-0.5"}
                autoComplete="off"
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
              <FormLabel as="legend" className="block mb-1.5" supportingText="(optional)">
                Body Location
              </FormLabel>
              <div className="flex flex-wrap gap-2">
                {ARMOUR_LOCATION_ORDER.map((loc) => (
                  <ToggleButton
                    key={loc}
                    selected={bodyLocation.includes(loc)}
                    selectedClassName={colourToggleSelected.red}
                    className="px-2.5 py-1 text-xs lg:text-sm font-medium"
                    onClick={() => toggleBodyLocation(loc)}
                  >
                    {ARMOUR_LOCATION_LABELS[loc]}
                  </ToggleButton>
                ))}
              </div>
            </fieldset>
          </CustomFormSection>
        )}

        {/* Force Field stats */}
        {selectedType === "Force Field" && (
          <CustomFormSection title="Stats">
            <div>
              <FormLabel htmlFor="custom-archeotech-protection-rating">Protection Rating</FormLabel>
              <input
                id="custom-archeotech-protection-rating"
                type="text"
                inputMode="numeric"
                value={protectionRating}
                onChange={(e) => setProtectionRating(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="e.g. 50"
                className={editableInputClass(true) + " mt-0.5"}
                autoComplete="off"
              />
            </div>
          </CustomFormSection>
        )}

        <CustomFormSection title="Description & Rules">
          <DescriptionAndRulesFields
            idPrefix="custom-archeotech"
            description={description}
            onDescriptionChange={setDescription}
            rules={rules}
            onRulesChange={setRules}
            descriptionPlaceholder="What it is, how it looks, where it came from…"
          />
          <div>
            <FormLabel htmlFor="custom-archeotech-notes" supportingText="(optional)">
              Notes
            </FormLabel>
            <textarea
              id="custom-archeotech-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Personal notes, where it was found…"
              rows={2}
              className={editableTextareaClass(true) + " mt-0.5"}
              autoComplete="off"
            />
          </div>
        </CustomFormSection>
      </>
    </CustomFormShell>
  );
}
