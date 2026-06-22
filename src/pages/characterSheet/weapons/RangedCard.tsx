// src/pages/characterSheet/weapons/RangedCard.tsx
// RangedPicker, CustomRangedForm, RangedCard — co-located for navigability.

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type {
  RangedWeapon,
  WeaponAmmoEntry,
  GrenadeItem,
  ArcheotechItem,
  WeaponCraftsmanship,
} from "../../../types/Character";
import {
  RANGED_WEAPON_REFERENCE,
  type RangedWeaponRef,
} from "../../../data/reference/weaponReference";
import {
  AMMO_REFERENCE,
  RECHARGING_POWER_PACKS_TEXT,
  formatAmmoName,
  isChargePackAmmoName,
  usesUnitAmmoTracking,
} from "../../../data/reference/ammoReference";
import { WEAPON_UPGRADE_REFERENCE } from "../../../data/reference/weaponUpgradeReference";
import {
  editableInputClass,
  editableTextareaClass,
  uiSection,
  uiSectionHeader,
  uiTextBody,
  uiTextLabel,
  uiTextMuted,
  uiTextPlaceholder,
  uiTextSubtle,
} from "../../../ui/editableStyles";
import { Button } from "../../../ui/Button";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { PickerModal } from "../../../ui/PickerModal";
import { QuantityControl } from "../../../ui/QuantityControl";
import { formatWeightForDisplay, formatWeightInput, sanitizeWeightInput } from "../../../ui/weightFormat";
import { formatMoneyForDisplay, formatMoneyInput, sanitizeMoneyInput } from "../../../ui/moneyFormat";
import { sourceColour } from "../../../ui/sourceStyles";
import { InfoModal } from "../../../components/InfoModal";
import {
  StatChip,
  DamageTypeChip,
  SpecialRulesContent,
  AttachmentPicker,
  AttachmentCard,
  EquipToggle,
  WeaponQualitySelector,
  DAMAGE_TYPE_OPTIONS,
  formatDamageInput,
  isValidDiceInput,
  sanitizeDiceInput,
  sanitizeNonNegativeIntegerInput,
  sanitizePositiveIntegerInput,
} from "./weaponShared";
import { WEAPON_SPECIAL_RULES } from "../../../data/reference/weaponSpecialRules";
import { effectiveRangedStats, getCompatibleUpgrades } from "./weaponHelpers";

const WEAPON_CRAFTSMANSHIP_OPTIONS: WeaponCraftsmanship[] = ["Poor", "Common", "Good", "Best"];

const WEAPON_CRAFTSMANSHIP_STYLE: Record<WeaponCraftsmanship, string> = {
  Poor: "border-red-500/70 bg-red-500/15 text-red-300",
  Common: "border-slate-500 bg-slate-800 text-slate-200",
  Good: "border-emerald-500/70 bg-emerald-500/15 text-emerald-300",
  Best: "border-amber-400 bg-amber-500/20 text-amber-300",
};

const CUSTOM_RANGED_CLASS_OPTIONS = ["Pistol", "Basic", "Heavy", "Thrown", "Exotic"] as const;
const RELOAD_TYPE_OPTIONS = ["Half", "Full", "Round", "Special", "—"] as const;
const CUSTOM_WEAPON_ORIGIN_OPTIONS = ["Custom", "2nd Ed"] as const;
const CUSTOM_AMMO_FAMILY_OPTIONS = [
  {
    label: "Las",
    ammoType: "Las",
    compatibleAmmoIds: [
      "cr-charge-pack-pistol",
      "cr-charge-pack-basic",
      "cr-charge-pack-heavy",
      "cr-hot-shot-charge",
    ],
  },
  {
    label: "Bolt",
    ammoType: "Bolt",
    compatibleAmmoIds: ["cr-bolt-shells", "cr-inferno-shells", "dh-psybolt-ammunition"],
  },
  {
    label: "Solid Projectile",
    ammoType: "Solid Projectile",
    compatibleAmmoIds: ["cr-bullets", "cr-dumdum-bullets", "cr-man-stopper-bullets"],
  },
  {
    label: "Shell",
    ammoType: "Shell",
    compatibleAmmoIds: ["cr-shells", "cr-inferno-shells", "dh-cryptus-shotgun-shells"],
  },
  {
    label: "Flame",
    ammoType: "Flame",
    compatibleAmmoIds: ["cr-fuel-pistol", "cr-fuel-basic", "dh-psyflame-ammunition"],
  },
  {
    label: "Melta",
    ammoType: "Melta",
    compatibleAmmoIds: ["cr-melta-canister-pistol", "cr-melta-canister-basic"],
  },
  {
    label: "Plasma",
    ammoType: "Plasma",
    compatibleAmmoIds: ["cr-plasma-flask-pistol", "cr-plasma-flask-basic"],
  },
  { label: "Launcher", ammoType: "Launcher", compatibleAmmoIds: [] },
  {
    label: "Primitive",
    ammoType: "Primitive",
    compatibleAmmoIds: ["cr-arrows-quarrels", "cr-shot", "lw-purity-round"],
  },
  { label: "Shuriken", ammoType: "Shuriken", compatibleAmmoIds: ["ca-shuriken-clip"] },
  { label: "Power Cell", ammoType: "Power Cell", compatibleAmmoIds: ["dh-synapse-power-cell"] },
  { label: "Exotic", ammoType: "Exotic", compatibleAmmoIds: ["cr-exotic"] },
] as const;

type AmmoTrackingMode = NonNullable<RangedWeapon["ammoTracking"]>;

const WEAPON_CLASS_STYLES: Record<string, { active: string; inactive: string }> = {
  Pistol: { active: "border-sky-500/60 bg-sky-500/10 text-sky-300", inactive: "border-sky-500/30 bg-sky-500/5 text-sky-400/50" },
  Basic:  { active: "border-teal-500/60 bg-teal-500/10 text-teal-300", inactive: "border-teal-500/30 bg-teal-500/5 text-teal-400/50" },
  Heavy:  { active: "border-violet-500/60 bg-violet-500/10 text-violet-300", inactive: "border-violet-500/30 bg-violet-500/5 text-violet-400/50" },
  Thrown: { active: "border-amber-500/60 bg-amber-500/10 text-amber-300", inactive: "border-amber-500/30 bg-amber-500/5 text-amber-400/50" },
  Exotic: { active: "border-fuchsia-500/60 bg-fuchsia-500/10 text-fuchsia-300", inactive: "border-fuchsia-500/30 bg-fuchsia-500/5 text-fuchsia-400/50" },
};

function weaponClassChip(cls?: string): { label: string; active: string; inactive: string } | undefined {
  if (!cls) return undefined;
  const n = cls.toLowerCase();
  for (const [key, style] of Object.entries(WEAPON_CLASS_STYLES)) {
    if (n.includes(key.toLowerCase())) return { label: key, ...style };
  }
  return { label: cls, active: "border-slate-500/60 bg-slate-700/40 text-slate-300", inactive: "border-slate-500/30 bg-slate-700/20 text-slate-400/50" };
}

function ammoFamilyChip(ammoType?: string): { label: string; className: string } | undefined {
  if (!ammoType) return undefined;
  const normalized = ammoType.toLowerCase();
  if (normalized === "las" || normalized.includes("charge pack")) {
    return { label: "Las", className: "border-red-500/60 bg-red-500/10 text-red-300" };
  }
  if (normalized === "bolt" || normalized.includes("bolt")) {
    return { label: "Bolt", className: "border-amber-500/60 bg-amber-500/10 text-amber-300" };
  }
  if (normalized === "solid projectile" || normalized.includes("bullet")) {
    return {
      label: "Solid Projectile",
      className: "border-slate-500/70 bg-slate-700/40 text-slate-300",
    };
  }
  if (normalized === "shell" || normalized.includes("shell") || normalized === "shot") {
    return { label: "Shell", className: "border-lime-500/60 bg-lime-500/10 text-lime-300" };
  }
  if (normalized === "flame" || normalized.includes("fuel")) {
    return { label: "Flame", className: "border-orange-500/60 bg-orange-500/10 text-orange-300" };
  }
  if (normalized === "melta" || normalized.includes("melta")) {
    return { label: "Melta", className: "border-violet-500/60 bg-violet-500/10 text-violet-300" };
  }
  if (normalized === "plasma" || normalized.includes("plasma")) {
    return { label: "Plasma", className: "border-sky-500/60 bg-sky-500/10 text-sky-300" };
  }
  if (normalized === "launcher" || normalized.includes("grenade")) {
    return { label: "Launcher", className: "border-yellow-500/60 bg-yellow-500/10 text-yellow-300" };
  }
  if (normalized === "primitive" || normalized.includes("arrow") || normalized.includes("quarrel")) {
    return { label: "Primitive", className: "border-stone-500/70 bg-stone-700/30 text-stone-300" };
  }
  if (normalized === "shuriken" || normalized.includes("shuriken")) {
    return { label: "Shuriken", className: "border-fuchsia-500/60 bg-fuchsia-500/10 text-fuchsia-300" };
  }
  if (normalized === "power cell" || normalized.includes("power cell")) {
    return { label: "Power Cell", className: "border-cyan-500/60 bg-cyan-500/10 text-cyan-300" };
  }
  if (normalized === "exotic" || normalized.includes("exotic")) {
    return { label: "Exotic", className: "border-teal-500/60 bg-teal-500/10 text-teal-300" };
  }
  return { label: ammoType, className: "border-slate-500/70 bg-slate-700/40 text-slate-300" };
}

function compatibleAmmoIdsForAmmoType(ammoType?: string): readonly string[] | undefined {
  return CUSTOM_AMMO_FAMILY_OPTIONS.find((option) => option.ammoType === ammoType)
    ?.compatibleAmmoIds;
}

function rangedCraftsmanshipDescription(craftsmanship: WeaponCraftsmanship): string {
  switch (craftsmanship) {
    case "Poor":
      return "Poor ranged weapons are more prone to malfunction. A Poor ranged weapon has the Unreliable quality. If it already has this quality, it jams on any failed roll to hit.";
    case "Good":
      return "Good ranged weapons are more reliable. A Good ranged weapon has the Reliable quality. If it already has this quality, there is no further effect beyond fine workmanship.";
    case "Best":
      return "Best ranged weapons never suffer from jamming or overheating. If a roll would result in either, count it as a miss instead.";
    case "Common":
    default:
      return "Common craftsmanship ranged weapons have no additional modifier.";
  }
}

// ─── Ranged Picker ────────────────────────────────────────────────────────────

export function RangedPicker({
  editable = true,
  onSelect,
  onCustom,
  onClose,
  references = RANGED_WEAPON_REFERENCE,
  title = "Add Ranged Weapon",
  placeholder = "Search weapons…",
  showCustom = true,
}: {
  editable?: boolean;
  onSelect: (ref: RangedWeaponRef, craftsmanship: WeaponCraftsmanship) => void;
  onCustom: () => void;
  onClose: () => void;
  references?: RangedWeaponRef[];
  title?: string;
  placeholder?: string;
  showCustom?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<RangedWeaponRef | null>(null);
  const [craftsmanship, setCraftsmanship] = useState<WeaponCraftsmanship>("Common");
  const [classFilter, setClassFilter] = useState<string | null>(null);
  const [familyFilter, setFamilyFilter] = useState<string | null>(null);
  const families = Array.from(
    new Map(
      references
        .map((r) => ammoFamilyChip(r.ammoType))
        .filter((f): f is NonNullable<typeof f> => f !== undefined)
        .map((f) => [f.label, f])
    ).values()
  );
  const filtered = references
    .filter((r) => r.name.toLowerCase().includes(query.toLowerCase()))
    .filter((r) => !classFilter || r.class.includes(classFilter))
    .filter((r) => !familyFilter || ammoFamilyChip(r.ammoType)?.label === familyFilter)
    .sort((a, b) => a.name.localeCompare(b.name));
  const modalTitle = editable ? title : title.replace(/^Add\b/, "View");

  function resetPicker() {
    setSelected(null);
    setCraftsmanship("Common");
  }

  const craftDialogRef = useRef<HTMLDialogElement | null>(null);
  useEffect(() => {
    const d = craftDialogRef.current;
    if (!d) return;
    d.showModal();
    return () => { if (d.open) d.close(); };
  }, [selected]);

  if (selected) {
    return createPortal(
      <dialog
        ref={craftDialogRef}
        onClose={resetPicker}
        onClick={(e) => { if (e.target === craftDialogRef.current) resetPicker(); }}
        className="m-auto w-[calc(100%-2rem)] max-w-md lg:max-w-lg bg-slate-900 border border-slate-500 rounded-xl shadow-2xl p-0 backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        <div className="flex items-center justify-between px-4 lg:px-5 py-3 lg:py-4 border-b border-slate-700">
          <h3 className="text-sm lg:text-base font-semibold text-slate-200">{selected.name}</h3>
          <button
            onClick={resetPicker}
            className="text-slate-400 hover:text-slate-200 text-lg leading-none"
          >
            {"\u00D7"}
          </button>
        </div>

        <div className="px-4 lg:px-5 py-4 lg:py-5 space-y-4">
          <div>
            <p className="text-xs lg:text-sm text-slate-400 mb-2">Select weapon craftsmanship:</p>
            <div className="flex gap-2">
              {WEAPON_CRAFTSMANSHIP_OPTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => setCraftsmanship(q)}
                  className={[
                    "flex-1 py-1.5 lg:py-2 rounded border text-sm lg:text-base font-medium transition",
                    craftsmanship === q
                      ? WEAPON_CRAFTSMANSHIP_STYLE[q]
                      : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500",
                  ].join(" ")}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className={`text-xs lg:text-sm ${uiTextBody} bg-slate-800/60 rounded p-3 lg:p-4 leading-relaxed`}>
            {rangedCraftsmanshipDescription(craftsmanship)}
          </div>
        </div>

        <div className="px-4 lg:px-5 py-3 lg:py-4 border-t border-slate-700 flex gap-2">
          <button
            onClick={resetPicker}
            className="px-4 lg:px-5 py-1.5 lg:py-2 rounded border border-slate-500 bg-slate-800 hover:bg-slate-700 text-sm lg:text-base text-slate-100"
          >
            Back
          </button>
          <Button className="flex-1" onClick={() => onSelect(selected, craftsmanship)}>
            Add Weapon
          </Button>
        </div>
      </dialog>,
      document.body
    );
  }

  return (
    <PickerModal
      title={modalTitle}
      placeholder={placeholder}
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={filtered.length === 0}
      filterRow={
        <div className="flex gap-2 w-full">
          <select
            value={classFilter ?? ""}
            onChange={(e) => setClassFilter(e.target.value || null)}
            className="flex-1 rounded border border-slate-500 bg-slate-900 px-2 py-1 text-xs lg:text-sm text-slate-200 focus:outline-none focus:border-red-500"
          >
            <option value="">All Classes</option>
            {(["Pistol", "Basic", "Heavy", "Thrown", "Exotic"] as const).map((cls) => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
          <select
            value={familyFilter ?? ""}
            onChange={(e) => setFamilyFilter(e.target.value || null)}
            className="flex-1 rounded border border-slate-500 bg-slate-900 px-2 py-1 text-xs lg:text-sm text-slate-200 focus:outline-none focus:border-red-500"
          >
            <option value="">All Types</option>
            {families.map((f) => (
              <option key={f.label} value={f.label}>{f.label}</option>
            ))}
          </select>
        </div>
      }
      footer={
        editable && showCustom ? (
          <button
            onClick={onCustom}
            className="w-full text-sm lg:text-base text-red-500 hover:text-red-400 text-center py-1 lg:py-1.5"
          >
            + Add custom weapon
          </button>
        ) : undefined
      }
    >
      {filtered.map((ref) => (
        <div
          key={ref.id}
          role="button"
          tabIndex={editable ? 0 : -1}
          onClick={editable ? () => setSelected(ref) : undefined}
          className={`w-full text-left px-4 lg:px-5 py-3 lg:py-4 transition group ${editable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"}`}
        >
          <span
            className={`text-sm lg:text-base font-medium text-slate-200 ${editable ? "group-hover:text-white" : ""}`}
          >
            {ref.name}
          </span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {(() => { const c = weaponClassChip(ref.class); return c ? (
              <span className={`px-1.5 py-0.5 rounded border text-xs font-semibold ${c.active}`}>{c.label}</span>
            ) : null; })()}
            {(() => { const f = ammoFamilyChip(ref.ammoType); return f ? (
              <span className={`px-1.5 py-0.5 rounded border text-xs font-semibold ${f.className}`}>{f.label}</span>
            ) : null; })()}
            <ItemMetaChips weight={ref.weight} value={ref.value} rarity={ref.rarity} source={ref.source} />
          </div>
          <div className={`flex items-center gap-2 text-xs lg:text-sm ${uiTextMuted} mt-0.5 flex-wrap font-code`}>
            <span>{ref.range}</span>
            <span>{ref.rof}</span>
            <span>{ref.damage}</span>
            <span>Pen {ref.pen}</span>
            <span>Clip {ref.clip}</span>
            {ref.ammoType && <span>{ref.ammoType}</span>}
          </div>
          {ref.specialRules && ref.specialRules !== "—" && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className={uiTextLabel}>Qualities</span>
              <span className={`text-xs lg:text-sm ${uiTextMuted} italic`}>{ref.specialRules}</span>
              <span className="inline-flex items-center -translate-y-[1.4px]">
                <InfoModal title={`${ref.name} Qualities`} content={<SpecialRulesContent rules={ref.specialRules} />} />
              </span>
            </div>
          )}
          {ref.description && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={uiTextLabel}>Rules</span>
              <span className="inline-flex items-center -translate-y-[1.4px]">
                <InfoModal title={ref.name} content={<SpecialRulesContent rules="" description={ref.description} />} />
              </span>
            </div>
          )}
        </div>
      ))}
    </PickerModal>
  );
}

// ─── Custom Ranged Form ───────────────────────────────────────────────────────

export function CustomRangedForm({
  onAdd,
  onCancel,
  title = "Custom Ranged Weapon",
  integrated = false,
}: {
  onAdd: (w: RangedWeapon) => void;
  onCancel: () => void;
  title?: string;
  integrated?: boolean;
}) {
  const [name, setName] = useState("");
  const [weaponClass, setWeaponClass] = useState("");
  const [craftsmanship, setCraftsmanship] = useState<"" | WeaponCraftsmanship>("");
  const [origin, setOrigin] = useState<"" | (typeof CUSTOM_WEAPON_ORIGIN_OPTIONS)[number]>("");
  const [rangeMeters, setRangeMeters] = useState("");
  const [ammoType, setAmmoType] = useState("");
  const [singleShot, setSingleShot] = useState(true);
  const [semiAuto, setSemiAuto] = useState("");
  const [fullAuto, setFullAuto] = useState("");
  const [damageBase, setDamageBase] = useState("1d10");
  const [damagePlus, setDamagePlus] = useState("0");
  const [damageType, setDamageType] = useState<(typeof DAMAGE_TYPE_OPTIONS)[number]["value"]>("I");
  const [pen, setPen] = useState("");
  const [clip, setClip] = useState("");
  const [reloadAmount, setReloadAmount] = useState("");
  const [reloadType, setReloadType] = useState("");
  const [ammoTracking, setAmmoTracking] = useState<"" | AmmoTrackingMode>("");
  const [weight, setWeight] = useState("");
  const [value, setValue] = useState("");
  const [selectedQualities, setSelectedQualities] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  const rof = `${singleShot ? "S" : "–"}/${semiAuto || "–"}/${fullAuto || "–"}`;
  const rld =
    reloadType === "Special" || reloadType === "—"
      ? reloadType
      : reloadAmount
        ? `${reloadAmount} ${reloadType}`
        : reloadType;
  const canAdd =
    Boolean(name.trim()) &&
    Boolean(weaponClass) &&
    Boolean(craftsmanship) &&
    Boolean(origin) &&
    Boolean(rangeMeters) &&
    Boolean(ammoType) &&
    (singleShot || Boolean(semiAuto) || Boolean(fullAuto)) &&
    isValidDiceInput(damageBase) &&
    Boolean(damagePlus) &&
    Boolean(pen) &&
    Boolean(clip) &&
    Boolean(reloadType) &&
    Boolean(ammoTracking) &&
    Boolean(weight.trim()) &&
    Boolean(value);

  const addWeapon = () => {
    if (!canAdd || !ammoTracking || !craftsmanship || !origin) return;
    onAdd({
      id: crypto.randomUUID(),
      custom: true,
      name: name.trim(),
      class: weaponClass,
      craftsmanship,
      source: origin,
      range: `${rangeMeters}m`,
      ammoType,
      rof,
      damage: formatDamageInput(damageBase, damagePlus, damageType),
      pen,
      clip,
      rld,
      ammoTracking,
      weight: formatWeightInput(weight),
      value: formatMoneyInput(value),
      specialRules: selectedQualities.length > 0 ? selectedQualities.join(", ") : undefined,
      description: description.trim() || undefined,
      integrated,
      quantity: weaponClass.toLowerCase().includes("thrown") ? 1 : undefined,
    });
  };

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
            <p className="text-xs lg:text-sm text-slate-300"><span className="text-red-500">*</span> Required</p>
          )}
          <div className="flex gap-2">
            <Button className="flex-1" onClick={addWeapon} disabled={!canAdd}>
              Add
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
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={editableInputClass(true) + " mt-0.5"}
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                Class <span className="text-red-500">*</span>
              </label>
              <select
                value={weaponClass}
                onChange={(event) => setWeaponClass(event.target.value)}
                className={editableInputClass(true) + " mt-0.5"}
              >
                <option value="">Choose class</option>
                {CUSTOM_RANGED_CLASS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <p className={uiSectionHeader}>Craftsmanship & Origin</p>
        <div className={uiSection + " space-y-3"}>
          <div className="space-y-1">
            <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
              Craftsmanship <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {WEAPON_CRAFTSMANSHIP_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCraftsmanship(option)}
                  className={[
                    "text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-1.5 rounded border transition",
                    craftsmanship === option
                      ? WEAPON_CRAFTSMANSHIP_STYLE[option]
                      : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-300",
                  ].join(" ")}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
              Origin <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {CUSTOM_WEAPON_ORIGIN_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setOrigin(option)}
                  className={[
                    "text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-1.5 rounded border transition",
                    origin === option
                      ? `${sourceColour(option)} bg-slate-800/70 font-semibold`
                      : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-300",
                  ].join(" ")}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className={uiSectionHeader}>Combat</p>
        <div className={uiSection + " space-y-3"}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                Range (m) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={rangeMeters}
                onChange={(event) => setRangeMeters(sanitizePositiveIntegerInput(event.target.value))}
                className={editableInputClass(true) + " mt-0.5"}
              />
            </div>

            <div>
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                Ammo Family <span className="text-red-500">*</span>
              </label>
              <select
                value={ammoType}
                onChange={(event) => setAmmoType(event.target.value)}
                className={editableInputClass(true) + " mt-0.5"}
              >
                <option value="">Choose ammo family</option>
                {CUSTOM_AMMO_FAMILY_OPTIONS.map((option) => (
                  <option key={option.ammoType} value={option.ammoType}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                Rate of Fire <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2 mt-0.5">
                <button
                  type="button"
                  onClick={() => setSingleShot((value) => !value)}
                  aria-pressed={singleShot}
                  className={[
                    "rounded border px-2 py-1 text-sm lg:text-base font-medium transition",
                    singleShot
                      ? "border-slate-400 bg-slate-700/70 text-slate-100"
                      : "border-slate-600 bg-slate-900 text-slate-400 hover:border-slate-500 hover:text-slate-300",
                  ].join(" ")}
                >
                  Single
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  value={semiAuto}
                  onChange={(event) => setSemiAuto(sanitizePositiveIntegerInput(event.target.value))}
                  placeholder="Semi"
                  className={editableInputClass(true)}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  value={fullAuto}
                  onChange={(event) => setFullAuto(sanitizePositiveIntegerInput(event.target.value))}
                  placeholder="Full"
                  className={editableInputClass(true)}
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                Damage <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2 mt-0.5">
                <input
                  type="text"
                  value={damageBase}
                  onChange={(event) => setDamageBase(sanitizeDiceInput(event.target.value))}
                  placeholder="1d10"
                  className={editableInputClass(true)}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  value={damagePlus}
                  onChange={(event) => setDamagePlus(sanitizeNonNegativeIntegerInput(event.target.value))}
                  placeholder="Plus"
                  className={editableInputClass(true)}
                />
                <select
                  value={damageType}
                  onChange={(event) =>
                    setDamageType(event.target.value as (typeof DAMAGE_TYPE_OPTIONS)[number]["value"])
                  }
                  className={editableInputClass(true)}
                >
                  {DAMAGE_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                Pen <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={pen}
                onChange={(event) => setPen(sanitizeNonNegativeIntegerInput(event.target.value))}
                className={editableInputClass(true) + " mt-0.5"}
              />
            </div>

            <div>
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                Clip <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={clip}
                onChange={(event) => setClip(sanitizeNonNegativeIntegerInput(event.target.value))}
                className={editableInputClass(true) + " mt-0.5"}
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                Reload <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 mt-0.5">
                <input
                  type="text"
                  inputMode="numeric"
                  value={reloadAmount}
                  onChange={(event) => setReloadAmount(sanitizePositiveIntegerInput(event.target.value))}
                  placeholder="Amount"
                  disabled={reloadType === "Special" || reloadType === "—"}
                  className={editableInputClass(reloadType !== "Special" && reloadType !== "—")}
                />
                <select
                  value={reloadType}
                  onChange={(event) => {
                    setReloadType(event.target.value);
                    if (event.target.value === "Special" || event.target.value === "—") {
                      setReloadAmount("");
                    }
                  }}
                  className={editableInputClass(true)}
                >
                  <option value="">Choose reload</option>
                  {RELOAD_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="col-span-2">
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                Ammo Tracking <span className="text-red-500">*</span>
              </label>
              <select
                value={ammoTracking}
                onChange={(event) => setAmmoTracking(event.target.value as "" | AmmoTrackingMode)}
                className={editableInputClass(true) + " mt-0.5"}
              >
                <option value="">Choose tracking</option>
                <option value="clip">Clips + rounds</option>
                <option value="loose">Rounds only</option>
              </select>
            </div>
          </div>
        </div>

        <p className={uiSectionHeader}>Details</p>
        <div className={uiSection + " space-y-3"}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                Weight <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={weight}
                onChange={(event) => setWeight(sanitizeWeightInput(event.target.value))}
                className={editableInputClass(true) + " mt-0.5"}
              />
            </div>

            <div>
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                Cost <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={value}
                onChange={(event) => setValue(sanitizeMoneyInput(event.target.value))}
                className={editableInputClass(true) + " mt-0.5"}
              />
            </div>
          </div>
        </div>

        <p className={uiSectionHeader}>Rules</p>
        <div className={uiSection + " space-y-3"}>
          <div className="grid grid-cols-2 gap-2">
            <WeaponQualitySelector selected={selectedQualities} onChange={setSelectedQualities} />

            <div className="col-span-2">
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                Rules
              </label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                className={editableTextareaClass(true) + " mt-0.5"}
              />
            </div>
          </div>
        </div>
      </div>
    </PickerModal>
  );
}

// ─── Ammo Entry Row ───────────────────────────────────────────────────────────

function AmmoEntryRow({
  entry,
  editable,
  clipSize,
  ammoTracking,
  weightKg,
  onSetLoaded,
  onRemove,
  onUpdateClips,
  onUpdateRounds,
  onSetLooseRounds,
}: {
  entry: WeaponAmmoEntry;
  editable: boolean;
  clipSize?: string;
  ammoTracking: AmmoTrackingMode;
  weightKg?: number;
  onSetLoaded: () => void;
  onRemove: () => void;
  onUpdateClips: (qty: number) => void;
  onUpdateRounds: (qty: number) => void;
  onSetLooseRounds: (qty: number) => void;
}) {
  const ammoRef = entry.referenceId
    ? AMMO_REFERENCE.find((ammo) => ammo.id === entry.referenceId)
    : undefined;
  const displayName = formatAmmoName(ammoRef?.name ?? entry.name);
  const isChargePack = isChargePackAmmoName(displayName);
  const hasAmmoInfo = !!ammoRef?.description || isChargePack;
  const clipSizeNumber = parseFloat(clipSize ?? "0") || 0;
  const looseRoundCount = entry.rounds + entry.clips * (clipSizeNumber || 1);
  const clipSizeLabel =
    clipSize && clipSize !== "0" && clipSize !== "—" && clipSize !== "N/A"
      ? `${clipSize}/clip`
      : undefined;
  const visibleClipSizeLabel = ammoTracking === "clip" ? clipSizeLabel : undefined;

  return (
    <div className="rounded bg-slate-800/60 px-2.5 lg:px-3 py-2 lg:py-2.5 space-y-1.5">
      {/* Name row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            onClick={editable ? onSetLoaded : undefined}
            title={entry.loaded ? "Loaded" : "Mark as loaded"}
            className={`w-2 h-2 rounded-full shrink-0 transition ${
              entry.loaded
                ? "bg-green-400"
                : editable
                  ? "bg-slate-600 hover:bg-green-500"
                  : "bg-slate-600"
            }`}
          />
          <span className="text-xs lg:text-sm text-slate-200 truncate">{displayName}</span>
          {hasAmmoInfo && (
            <span className="inline-flex items-center -translate-y-[1.4px]">
              <InfoModal
                title={displayName}
                content={
                  <div className="space-y-2">
                    {ammoRef?.description && (
                      <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{ammoRef.description}</p>
                    )}
                    {isChargePack && (
                      <div className="space-y-1">
                        <p className="text-sm lg:text-base font-semibold text-slate-100">Recharging Power Packs</p>
                        <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>
                          {RECHARGING_POWER_PACKS_TEXT}
                        </p>
                      </div>
                    )}
                  </div>
                }
              />
            </span>
          )}
          {entry.loaded && (
            <span className="text-[10px] lg:text-xs text-green-500 uppercase tracking-wide shrink-0">
              Loaded
            </span>
          )}
        </div>
        {editable && (
          <button
            onClick={onRemove}
            className="text-xs lg:text-sm text-red-400 hover:text-red-300 shrink-0 leading-none"
          >
            ×
          </button>
        )}
      </div>

      {(ammoRef || visibleClipSizeLabel || weightKg !== undefined) && (
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] lg:text-xs">
          {visibleClipSizeLabel && (
            <span className={`rounded border border-slate-700 bg-slate-900/40 px-1.5 py-0.5 ${uiTextMuted}`}>
              {visibleClipSizeLabel}
            </span>
          )}
          {ammoRef && (
            <>
              <span className="rounded border border-slate-700 bg-slate-900/40 px-1.5 py-0.5 text-amber-400/80">
                {formatMoneyForDisplay(ammoRef.cost)}
              </span>
              <span className={`rounded border border-slate-700 bg-slate-900/40 px-1.5 py-0.5 ${uiTextMuted}`}>
                per {ammoRef.purchaseAmount}
              </span>
            </>
          )}
          <span className={`rounded border border-slate-700 bg-slate-900/40 px-1.5 py-0.5 ${uiTextMuted}`}>
            ⚖ {formatWeightForDisplay(formatWeight(weightKg ?? 0))}
          </span>
        </div>
      )}

      {/* Count */}
      <div className="flex items-center gap-4">
        {ammoTracking === "loose" ? (
          <div className="flex items-center gap-1.5">
            <span className={`w-16 lg:w-[4.5rem] ${uiTextLabel}`}>
              Rounds
            </span>
            <QuantityControl
              quantity={looseRoundCount}
              editable={editable}
              size="sm"
              onUpdate={onSetLooseRounds}
            />
          </div>
        ) : (
          <div className="flex flex-col items-start gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className={`w-16 lg:w-[4.5rem] ${uiTextLabel}`}>
                Clips
              </span>
              <QuantityControl
                quantity={entry.clips}
                editable={editable}
                size="sm"
                onUpdate={onUpdateClips}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-16 lg:w-[4.5rem] ${uiTextLabel}`}>
                Rounds
              </span>
              <QuantityControl
                quantity={entry.rounds}
                editable={editable}
                size="sm"
                onUpdate={onUpdateRounds}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Ammo Picker ──────────────────────────────────────────────────────────────

function AmmoPicker({
  compatibleIds,
  existingNames,
  editable = true,
  onSelect,
  onClose,
}: {
  compatibleIds?: readonly string[];
  existingNames: Set<string>;
  editable?: boolean;
  onSelect: (name: string, referenceId?: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [customName, setCustomName] = useState("");

  const pool = compatibleIds
    ? AMMO_REFERENCE.filter((a) => compatibleIds.includes(a.id))
    : AMMO_REFERENCE;

  const options = query.trim()
    ? pool.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()))
    : pool;

  return (
    <PickerModal
      title={editable ? "Add Ammo Type" : "View Ammo Types"}
      placeholder="Search ammo…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={options.length === 0}
      footer={
        editable ? (
          <div className="space-y-2">
            <p className={`text-xs lg:text-sm ${uiTextMuted}`}>Custom / unlisted ammo</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Ammo name…"
                className="flex-1 text-sm lg:text-base bg-slate-800 border border-slate-600 rounded px-2 lg:px-3 py-1 lg:py-1.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              <Button
                onClick={() => {
                  if (customName.trim()) {
                    onSelect(customName.trim());
                    onClose();
                  }
                }}
                disabled={!customName.trim() || existingNames.has(customName.trim())}
              >
                Add
              </Button>
            </div>
          </div>
        ) : undefined
      }
    >
      {options.map((ammo) => (
        <button
          key={ammo.id}
          onClick={
            editable
              ? () => {
                  onSelect(formatAmmoName(ammo.name), ammo.id);
                  onClose();
                }
              : undefined
          }
          disabled={editable && existingNames.has(formatAmmoName(ammo.name))}
          className={`w-full text-left px-4 lg:px-5 py-3 lg:py-4 transition group ${
            editable ? "hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed" : "cursor-default"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm lg:text-base font-medium text-slate-200 group-hover:text-white">
              {formatAmmoName(ammo.name)}
            </span>
            <div className="flex items-center gap-1.5 text-xs lg:text-sm shrink-0">
              <span className={uiTextSubtle}>{ammo.rarity}</span>
              <span className={uiTextSubtle}>·</span>
              <span className="text-amber-400/80">{formatMoneyForDisplay(ammo.cost)}</span>
              <span className={uiTextSubtle}>/ {ammo.purchaseAmount}</span>
            </div>
          </div>
          {ammo.description && (
            <p className={`text-xs lg:text-sm ${uiTextMuted} mt-0.5 line-clamp-2`}>{ammo.description}</p>
          )}
        </button>
      ))}
    </PickerModal>
  );
}

// ─── Ammo Weight ─────────────────────────────────────────────────────────────
// CR rule: a full clip weighs 10% of the weapon's weight.

function calcEntryWeight(
  weaponWeight: string | undefined,
  clip: string | undefined,
  entry: WeaponAmmoEntry,
  ammoTracking: AmmoTrackingMode
): number {
  const weaponKg = parseFloat(weaponWeight ?? "0");
  if (!weaponKg) return 0;
  const clipSize = parseFloat(clip ?? "1") || 1;
  const clipWeight = weaponKg * 0.1;
  if (ammoTracking === "loose") {
    return (entry.rounds + entry.clips * clipSize) * (clipWeight / clipSize);
  }
  const ammoRef = entry.referenceId
    ? AMMO_REFERENCE.find((ammo) => ammo.id === entry.referenceId)
    : undefined;
  if (ammoRef?.id === "cr-hot-shot-charge") {
    return entry.clips * clipWeight;
  }
  if (usesUnitAmmoTracking(ammoRef)) {
    return entry.clips * (clipWeight / clipSize);
  }
  return entry.clips * clipWeight + (entry.rounds / clipSize) * clipWeight;
}

function formatWeight(kg: number): string {
  // Drop trailing zeros: 0.700 → "0.7", 0.500 → "0.5", 1.000 → "1"
  return parseFloat(kg.toFixed(2)).toString();
}

// ─── Ranged Card ──────────────────────────────────────────────────────────────

export function RangedCard({
  weapon,
  editable,
  onRemove,
  onAddAttachment,
  onRemoveAttachment,
  onUpdateAmmoEntries,
  onUpdateQuantity,
  grenades,
  onUpdateGrenades,
  archeotechGrenades,
  allowAttachments = true,
  isEquipped = false,
  onToggleEquip,
  slotsDisabled = false,
  forceExpanded = false,
}: {
  weapon: RangedWeapon;
  editable: boolean;
  onRemove: () => void;
  onAddAttachment: (upgradeId: string) => void;
  onRemoveAttachment: (upgradeId: string) => void;
  onUpdateAmmoEntries: (entries: WeaponAmmoEntry[]) => void;
  onUpdateQuantity: (qty: number) => void;
  grenades?: GrenadeItem[];
  onUpdateGrenades?: (next: GrenadeItem[]) => void;
  archeotechGrenades?: ArcheotechItem[];
  allowAttachments?: boolean;
  isEquipped?: boolean;
  onToggleEquip?: () => void;
  slotsDisabled?: boolean;
  forceExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(isEquipped);
  useEffect(() => {
    setExpanded(isEquipped);
  }, [isEquipped]);

  const [showAttachPicker, setShowAttachPicker] = useState(false);
  const [showAmmoPicker, setShowAmmoPicker] = useState(false);

  const attachmentIds = weapon.attachments ?? [];
  const attachmentRefs = WEAPON_UPGRADE_REFERENCE.filter((upgrade) =>
    attachmentIds.includes(upgrade.id)
  );
  // Resolve reference data first — source of truth for stats, avoids stale stored character data
  const weaponRef = weapon.referenceId
    ? RANGED_WEAPON_REFERENCE.find((r) => r.id === weapon.referenceId)
    : RANGED_WEAPON_REFERENCE.find(
        (r) => r.name === weapon.name && (!weapon.source || r.source === weapon.source)
      );
  const craftsmanship = weapon.craftsmanship ?? "Common";
  const baseSpecialRules =
    craftsmanship === "Common"
      ? (weaponRef?.specialRules ?? weapon.specialRules)
      : (weapon.specialRules ?? weaponRef?.specialRules);
  const baseWeapon = weaponRef ? { ...weapon, specialRules: baseSpecialRules } : weapon;
  const ammoTracking: AmmoTrackingMode = weapon.ammoTracking ?? weaponRef?.ammoTracking ?? "clip";
  const ammoEntries = weapon.ammoEntries ?? [];
  const loadedAmmoEntry = ammoEntries.find((entry) => entry.loaded);
  const loadedAmmoRef = loadedAmmoEntry?.referenceId
    ? AMMO_REFERENCE.find((ammo) => ammo.id === loadedAmmoEntry.referenceId)
    : undefined;
  const effective = effectiveRangedStats(baseWeapon, attachmentRefs, loadedAmmoRef);
  const resolvedAmmoType = weaponRef?.ammoType ?? weapon.ammoType;
  const addableCompatible = getCompatibleUpgrades(weapon.class ?? "", weapon.name, false, attachmentIds, resolvedAmmoType);
  const viewableCompatible = getCompatibleUpgrades(weapon.class ?? "", weapon.name, false, [], resolvedAmmoType);
  const visibleCompatible = allowAttachments
    ? editable
      ? addableCompatible
      : viewableCompatible
    : [];

  const rulesText = effective.specialRules?.trim() ?? "";
  const ruleNamesInLookup = (effective.specialRules ?? "")
    .split(",")
    .map((r) => r.trim().replace(/\s*\(.*?\)/, ""))
    .filter((name) => Boolean(name) && Boolean(WEAPON_SPECIAL_RULES[name]));
  const ammoFamily = ammoFamilyChip(weaponRef?.ammoType ?? weapon.ammoType);
  const rulesDescription = weaponRef?.description ?? weapon.description;
  const hasQualities = Boolean(
    rulesText && rulesText !== "—" && rulesText !== "-" && rulesText !== "â€”"
  );
  const hasQualityModal = ruleNamesInLookup.length > 0;
  const hasItemRules = !!rulesDescription;

  const isThrown =
    weapon.class?.toLowerCase().includes("thrown") ||
    weaponRef?.class.toLowerCase().includes("thrown");
  const isGrenadeLauncher =
    weapon.referenceId === "cr-grenade-launcher" || weapon.referenceId === "cr-rpg-launcher";
  const hasAmmo =
    !isThrown && !isGrenadeLauncher && !!(weaponRef?.ammoType || weapon.ammoType || weapon.custom);

  const existingAmmoNames = new Set(ammoEntries.map((e) => formatAmmoName(e.name)));

  // ── Ammo helpers ────────────────────────────────────────────────────────────

  function handleAddAmmo(name: string, referenceId?: string) {
    const isFirst = ammoEntries.length === 0;
    const ammoRef = referenceId
      ? AMMO_REFERENCE.find((ammo) => ammo.id === referenceId)
      : undefined;
    const usesUnitTracking = ammoTracking === "clip" && usesUnitAmmoTracking(ammoRef);
    onUpdateAmmoEntries([
      ...ammoEntries,
      {
        id: crypto.randomUUID(),
        referenceId,
        name,
        clips: usesUnitTracking ? 1 : 0,
        rounds: 0,
        loaded: isFirst,
      },
    ]);
  }

  function handleRemoveAmmo(entryId: string) {
    const next = ammoEntries.filter((e) => e.id !== entryId);
    // If we removed the loaded entry, mark the first remaining one as loaded
    const removedWasLoaded = ammoEntries.find((e) => e.id === entryId)?.loaded ?? false;
    if (removedWasLoaded && next.length > 0) {
      next[0] = { ...next[0], loaded: true };
    }
    onUpdateAmmoEntries(next);
  }

  function handleSetLoaded(entryId: string) {
    onUpdateAmmoEntries(ammoEntries.map((e) => ({ ...e, loaded: e.id === entryId })));
  }

  function handleUpdateEntry(entryId: string, patch: Partial<WeaponAmmoEntry>) {
    onUpdateAmmoEntries(ammoEntries.map((e) => (e.id === entryId ? { ...e, ...patch } : e)));
  }

  return (
    <div className={uiSection + " space-y-3"}>
      {/* Header — always visible */}
      <div className="flex items-start justify-between gap-2">
        <button
          className="flex-1 min-w-0 text-left"
          onClick={() => !forceExpanded && setExpanded((e) => !e)}
          disabled={forceExpanded}
        >
          <p className="text-sm lg:text-base font-semibold text-slate-200">{weapon.name}</p>
          {(weapon.class || ammoFamily) && (
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              {(() => { const c = weaponClassChip(weapon.class); return c ? (
                <span className={`text-[10px] lg:text-xs rounded border px-1.5 py-0.5 font-medium whitespace-nowrap ${c.active}`}>{c.label}</span>
              ) : null; })()}
              {ammoFamily && (
                <span
                  className={[
                    "text-[10px] lg:text-xs rounded border px-1.5 py-0.5 font-medium whitespace-nowrap",
                    ammoFamily.className,
                  ].join(" ")}
                >
                  {ammoFamily.label}
                </span>
              )}
            </div>
          )}
        </button>
        <div className="flex items-center gap-2 shrink-0">
          {onToggleEquip && (
            <EquipToggle
              equipped={isEquipped}
              disabled={slotsDisabled}
              editable={editable}
              onChange={onToggleEquip}
            />
          )}
          {!forceExpanded && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="text-slate-400 hover:text-slate-200 transition"
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`w-4 h-4 transition-transform ${expanded ? "" : "-rotate-90"}`}
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
          {editable && (expanded || forceExpanded) && (
            <button onClick={onRemove} className="text-xs lg:text-sm text-red-400 hover:text-red-300 shrink-0">
              Remove
            </button>
          )}
        </div>
      </div>

      {(expanded || forceExpanded) && (
        <>
          {/* Stats grid */}
          <div className="flex flex-wrap gap-1.5">
            {effective.range && <StatChip label="Range" value={effective.range} />}
            {weapon.rof && <StatChip label="RoF" value={weapon.rof} />}
            {effective.damage && (
              <StatChip label="Damage" value={effective.damage.replace(/\s*[IREX]$/i, "").trim()} />
            )}
            {effective.damage && <DamageTypeChip damage={effective.damage} />}
            {effective.pen && <StatChip label="Pen" value={effective.pen} />}
            {effective.clip && <StatChip label="Clip" value={effective.clip} />}
            {weapon.rld && <StatChip label="Reload" value={weapon.rld} />}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className={uiTextLabel}>Qualities</span>
              <span className={`text-xs lg:text-sm ${uiTextMuted} italic`}>
                {hasQualities ? rulesText : "-"}
              </span>
              {hasQualityModal && (
                <span className="inline-flex items-center -translate-y-[1.4px]">
                  <InfoModal
                    title={`${weapon.name} Qualities`}
                    content={<SpecialRulesContent rules={effective.specialRules ?? ""} />}
                  />
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className={uiTextLabel}>Rules</span>
              {hasItemRules ? (
                <span className="inline-flex items-center -translate-y-[1.4px]">
                  <InfoModal
                    title={`${weapon.name} Rules`}
                    content={<SpecialRulesContent rules="" description={rulesDescription} />}
                  />
                </span>
              ) : (
                <span className={`text-xs lg:text-sm ${uiTextPlaceholder}`}>-</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className={uiTextLabel}>
                Craftsmanship
              </span>
              <span className={`text-xs lg:text-sm ${uiTextMuted} italic`}>{craftsmanship}</span>
              <span className="inline-flex items-center -translate-y-[1.4px]">
                <InfoModal
                  title={`${craftsmanship} Weapon`}
                  content={rangedCraftsmanshipDescription(craftsmanship)}
                />
              </span>
            </div>
          </div>

          {/* Weight / Value / Rarity / Source */}
          <div className="flex flex-wrap gap-1.5 border-t border-slate-800 pt-2 mt-1">
            <ItemMetaChips
              weight={effective.weight}
              value={weapon.value}
              rarity={weapon.rarity}
              source={weapon.source}
              bare
            />
          </div>

          {/* Thrown weapon: quantity counter */}
          {isThrown && (
            <div className="border-t border-slate-800 pt-2 flex items-center justify-between gap-2">
              <span className={uiTextLabel}>{isThrown ? "Quantity" : "Rounds"}</span>
              <QuantityControl
                quantity={weapon.quantity ?? 0}
                editable={editable}
                size="sm"
                onUpdate={onUpdateQuantity}
              />
            </div>
          )}

          {/* Grenade launcher: ammo drawn from grenade inventory */}
          {isGrenadeLauncher && (
            <div className="border-t border-slate-800 pt-2 space-y-2">
              <span className={uiTextLabel}>Grenades</span>
              {(grenades ?? []).filter((g) => g.type !== "Mine").length === 0 &&
              (archeotechGrenades ?? []).length === 0 ? (
                <p className={`text-xs lg:text-sm ${uiTextPlaceholder}`}>
                  No grenades — add via the Grenades & Mines section below.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {(grenades ?? [])
                    .filter((g) => g.type !== "Mine")
                    .map((g) => (
                      <div
                        key={g.id}
                        className="rounded bg-slate-800/60 px-2.5 lg:px-3 py-2 lg:py-2.5 flex items-center justify-between gap-2"
                      >
                        <span className="text-xs lg:text-sm text-slate-200 truncate">{g.name}</span>
                        <QuantityControl
                          quantity={g.quantity}
                          editable={editable}
                          size="sm"
                          onUpdate={(qty) =>
                            onUpdateGrenades?.(
                              (grenades ?? []).map((x) =>
                                x.id === g.id ? { ...x, quantity: qty } : x
                              )
                            )
                          }
                        />
                      </div>
                    ))}
                  {(archeotechGrenades ?? []).map((g) => (
                    <div
                      key={g.id}
                      className="rounded bg-amber-900/20 border border-amber-700/30 px-2.5 lg:px-3 py-2 lg:py-2.5 flex items-center justify-between gap-2"
                    >
                      <span className="text-xs lg:text-sm text-slate-200 truncate">{g.name}</span>
                      <span className="text-[10px] lg:text-xs text-amber-400 border border-amber-700/50 rounded px-1.5 py-0.5">
                        Archeotech
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Regular weapon: ammo entries */}
          {hasAmmo && (
            <div className="border-t border-slate-800 pt-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] lg:text-xs text-red-500 uppercase tracking-wide">Ammo</span>
                <button
                  onClick={() => setShowAmmoPicker(true)}
                  className="text-xs lg:text-sm px-2 py-0.5 rounded border border-red-500 text-red-500 hover:bg-red-500/10 transition"
                >
                  {editable ? "+ Add" : "View"}
                </button>
              </div>

              {ammoEntries.length === 0 ? (
                <p className={`text-xs lg:text-sm ${uiTextPlaceholder}`}>No ammo tracked</p>
              ) : (
                <div className="space-y-1.5">
                  {ammoEntries.map((entry) => (
                    <AmmoEntryRow
                      key={entry.id}
                      entry={entry}
                      editable={editable}
                      clipSize={effective.clip}
                      ammoTracking={ammoTracking}
                      weightKg={calcEntryWeight(effective.weight, effective.clip, entry, ammoTracking)}
                      onSetLoaded={() => handleSetLoaded(entry.id)}
                      onRemove={() => handleRemoveAmmo(entry.id)}
                      onUpdateClips={(qty) => handleUpdateEntry(entry.id, { clips: qty })}
                      onUpdateRounds={(qty) => handleUpdateEntry(entry.id, { rounds: qty })}
                      onSetLooseRounds={(qty) => handleUpdateEntry(entry.id, { clips: 0, rounds: qty })}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Attachments */}
          {(attachmentRefs.length > 0 || visibleCompatible.length > 0) && (
            <div className="border-t border-slate-800 pt-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] lg:text-xs text-red-500 uppercase tracking-wide">Attachments</span>
                {(editable ? visibleCompatible.length > 0 : attachmentRefs.length > 0 || visibleCompatible.length > 0) && (
                  <button
                    onClick={() => setShowAttachPicker(true)}
                    className="text-xs lg:text-sm px-2 py-0.5 rounded border border-red-500 text-red-500 hover:bg-red-500/10 transition"
                  >
                    {editable ? "+ Add" : "View"}
                  </button>
                )}
              </div>
              {attachmentRefs.length === 0 ? (
                <p className={`text-xs lg:text-sm ${uiTextPlaceholder}`}>None fitted</p>
              ) : (
                <div className="space-y-1.5">
                  {attachmentRefs.map((upgrade) => (
                    <AttachmentCard
                      key={upgrade.id}
                      upgrade={upgrade}
                      editable={editable}
                      onRemove={onRemoveAttachment}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {showAttachPicker && (
            <AttachmentPicker
              compatibleUpgrades={visibleCompatible}
              editable={editable}
              onSelect={(id) => {
                onAddAttachment(id);
                setShowAttachPicker(false);
              }}
              onClose={() => setShowAttachPicker(false)}
            />
          )}

          {showAmmoPicker && (
            <AmmoPicker
              compatibleIds={weaponRef?.compatibleAmmoIds ?? compatibleAmmoIdsForAmmoType(weapon.ammoType)}
              existingNames={existingAmmoNames}
              editable={editable}
              onSelect={handleAddAmmo}
              onClose={() => setShowAmmoPicker(false)}
            />
          )}
        </>
      )}
    </div>
  );
}
