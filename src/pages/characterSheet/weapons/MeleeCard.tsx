// src/pages/characterSheet/weapons/MeleeCard.tsx
// MeleePicker, CustomMeleeForm, MeleeCard — co-located for navigability.

import { useState, useEffect } from "react";
import type { MeleeWeapon } from "../../../types/Character";
import {
  MELEE_WEAPON_REFERENCE,
  type MeleeWeaponRef,
} from "../../../data/reference/weaponReference";
import { WEAPON_SPECIAL_RULES } from "../../../data/reference/weaponSpecialRules";
import { WEAPON_UPGRADE_REFERENCE } from "../../../data/reference/weaponUpgradeReference";
import { editableInputClass, sectionContainerClass } from "../../../ui/editableStyles";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { PickerModal } from "../../../ui/PickerModal";
import { QuantityControl } from "../../../ui/QuantityControl";
import { InfoModal } from "../../../components/InfoModal";
import {
  StatChip,
  DamageTypeChip,
  computeMeleeTotalDamage,
  SpecialRulesModal,
  SpecialRulesContent,
  AttachmentPicker,
  AttachmentCard,
  EquipToggle,
} from "./weaponShared";
import { effectiveMeleeStats, getCompatibleUpgrades } from "./weaponHelpers";

function hasMultipleMeleeProfiles(damage?: string): boolean {
  return !!damage && /\bLow:\s|\bHigh:\s|;/.test(damage);
}

function displayMeleeDamage(damage: string): string {
  return hasMultipleMeleeProfiles(damage)
    ? damage
    : damage.replace(/\s*[IREX]$/i, "").trim();
}

// ─── Melee Picker ─────────────────────────────────────────────────────────────

export function MeleePicker({
  editable = true,
  onSelect,
  onCustom,
  onClose,
  references = MELEE_WEAPON_REFERENCE,
  title = "Add Melee Weapon",
  placeholder = "Search weapons…",
  showCustom = true,
}: {
  editable?: boolean;
  onSelect: (ref: MeleeWeaponRef) => void;
  onCustom: () => void;
  onClose: () => void;
  references?: MeleeWeaponRef[];
  title?: string;
  placeholder?: string;
  showCustom?: boolean;
}) {
  const [query, setQuery] = useState("");
  const filtered = references.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <PickerModal
      title={title}
      placeholder={placeholder}
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={filtered.length === 0}
      footer={editable && showCustom ? (
        <button
          onClick={onCustom}
          className="w-full text-sm text-amber-400 hover:text-amber-300 text-center py-1"
        >
          + Add custom weapon
        </button>
      ) : undefined}
    >
      {filtered.map((ref) => (
        <button
          key={ref.id}
          onClick={editable ? () => onSelect(ref) : undefined}
          className={`w-full text-left px-4 py-3 transition group ${editable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"}`}
        >
          <span className={`text-sm font-medium text-slate-200 ${editable ? "group-hover:text-white" : ""}`}>
            {ref.name}
          </span>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap font-mono">
            <span>{ref.twoHanded ? "Two-Handed" : ref.class}</span>
            <span>{ref.damage}</span>
            <span>Pen {ref.pen}</span>
          </div>
        </button>
      ))}
    </PickerModal>
  );
}

// ─── Custom Melee Form ────────────────────────────────────────────────────────

export function CustomMeleeForm({
  onAdd,
  onCancel,
}: {
  onAdd: (w: MeleeWeapon) => void;
  onCancel: () => void;
}) {
  const [fields, setFields] = useState<Omit<MeleeWeapon, "id" | "custom">>({
    name: "", class: "", damage: "", pen: "", specialRules: "",
  });

  const makeFieldSetter =
    (k: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setFields((prev) => ({ ...prev, [k]: e.target.value }));

  return (
    <div className="border border-amber-500/30 bg-slate-900/60 rounded-lg p-4 space-y-3">
      <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
        Custom Melee Weapon
      </p>
      <div className="grid grid-cols-2 gap-2">
        {(["name", "class", "damage", "pen", "specialRules"] as const).map((k) => (
          <div key={k} className={k === "name" || k === "specialRules" ? "col-span-2" : ""}>
            <label className="text-xs font-medium uppercase tracking-wide text-slate-100">{k}</label>
            <input
              type="text"
              value={fields[k] ?? ""}
              onChange={makeFieldSetter(k)}
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={() =>
            onAdd({
              id: crypto.randomUUID(),
              custom: true,
              ...fields,
              quantity: fields.class?.toLowerCase().includes("thrown") ? 1 : undefined,
            })
          }
          disabled={!fields.name?.trim()}
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

// ─── Melee Card ───────────────────────────────────────────────────────────────

export function MeleeCard({
  weapon,
  editable,
  strengthBonus,
  onRemove,
  onAddAttachment,
  onRemoveAttachment,
  onUpdateQuantity,
  allowAttachments = true,
  isEquipped = false,
  onToggleEquip,
  slotsDisabled = false,
  forceExpanded = false,
}: {
  weapon: MeleeWeapon;
  editable: boolean;
  strengthBonus: number;
  onRemove: () => void;
  onAddAttachment: (upgradeId: string) => void;
  onRemoveAttachment: (upgradeId: string) => void;
  onUpdateQuantity: (qty: number) => void;
  allowAttachments?: boolean;
  isEquipped?: boolean;
  onToggleEquip?: () => void;
  slotsDisabled?: boolean;
  forceExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(isEquipped);
  useEffect(() => { setExpanded(isEquipped); }, [isEquipped]);

  const [showQualities, setShowQualities] = useState(false);
  const [showItemRules, setShowItemRules] = useState(false);
  const [showAttachPicker, setShowAttachPicker] = useState(false);

  const attachmentIds = weapon.attachments ?? [];
  const attachmentRefs = WEAPON_UPGRADE_REFERENCE.filter((upgrade) =>
    attachmentIds.includes(upgrade.id)
  );
  const weaponRef = weapon.referenceId
    ? MELEE_WEAPON_REFERENCE.find((r) => r.id === weapon.referenceId)
    : undefined;
  // Prefer reference specialRules as source of truth; avoids stale stored character data
  const baseWeapon = weaponRef ? { ...weapon, specialRules: weaponRef.specialRules } : weapon;
  const effective = effectiveMeleeStats(baseWeapon, attachmentRefs);
  const hasMultipleProfiles = hasMultipleMeleeProfiles(weapon.damage);
  const compatible = getCompatibleUpgrades(
    weapon.class ?? "",
    weapon.name,
    true,
    attachmentIds
  );
  const visibleCompatible = allowAttachments ? compatible : [];
  const rulesText = effective.specialRules?.trim() ?? "";
  const hasRules = Boolean(rulesText && rulesText !== "—" && rulesText !== "-");
  const ruleNamesInLookup = (effective.specialRules ?? "")
    .split(",")
    .map((r) => r.trim().replace(/\s*\(.*?\)/, ""))
    .filter((name) => Boolean(name) && Boolean(WEAPON_SPECIAL_RULES[name]));
  const hasModal = !!(weaponRef?.description) || ruleNamesInLookup.length > 0;
  const rulesDisplayText = hasRules ? rulesText : hasModal ? "Special rules" : "";
  const hasQualities = Boolean(
    rulesText && rulesText !== "—" && rulesText !== "-" && rulesText !== "â€”"
  );
  const rulesDescription = weaponRef?.description;
  const hasQualityModal = ruleNamesInLookup.length > 0;
  const hasItemRules = !!rulesDescription;
  const isThrown =
    weapon.class?.toLowerCase().includes("thrown") ||
    weaponRef?.class.toLowerCase().includes("thrown");

  return (
    <div className={sectionContainerClass(editable) + " space-y-3"}>
      {/* Header — always visible */}
      <div className="flex items-start justify-between gap-2">
        <button
          className="flex-1 min-w-0 text-left"
          onClick={() => !forceExpanded && setExpanded((e) => !e)}
          disabled={forceExpanded}
        >
          <p className="text-sm font-semibold text-slate-200">{weapon.name}</p>
          {weapon.class && (
            <p className="text-xs text-slate-500">{weapon.class}</p>
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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 transition-transform ${expanded ? "" : "-rotate-90"}`}>
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/>
              </svg>
            </button>
          )}
          {editable && (expanded || forceExpanded) && (
            <button
              onClick={onRemove}
              className="text-xs text-red-400 hover:text-red-300 shrink-0"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {(expanded || forceExpanded) && (<>
      <div className="flex flex-wrap gap-1.5">
        {weapon.damage && (
          <StatChip
            label="Damage"
            value={displayMeleeDamage(weapon.damage)}
          />
        )}
        {weapon.damage && !hasMultipleProfiles && <DamageTypeChip damage={weapon.damage} />}
        {effective.pen && <StatChip label="Pen" value={effective.pen} />}
        <StatChip label="SB" value={`+${strengthBonus}`} />
        {weapon.damage && !hasMultipleProfiles && (
          <StatChip
            label="Total"
            value={computeMeleeTotalDamage(weapon.damage, strengthBonus)}
          />
        )}
      </div>

      {false && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 italic">
            {rulesDisplayText}
          </span>
          {hasModal && (
            <button
              onClick={() => setShowQualities(true)}
              title="Explain special rules"
              className="text-slate-500 hover:text-amber-400 text-sm transition"
            >
              ⓘ
            </button>
          )}
        </div>
      )}

      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500 uppercase tracking-wide">Qualities</span>
          <span className="text-xs text-slate-400 italic">
            {hasQualities ? rulesText : "-"}
          </span>
          {hasQualityModal && (
            <InfoModal
              title={`${weapon.name} Qualities`}
              content={<SpecialRulesContent rules={effective.specialRules ?? ""} />}
            />
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500 uppercase tracking-wide">Rules</span>
          {hasItemRules ? (
            <InfoModal
              title={`${weapon.name} Rules`}
              content={<SpecialRulesContent rules="" description={rulesDescription} />}
            />
          ) : (
            <span className="text-xs text-slate-600 italic">-</span>
          )}
        </div>
      </div>

      {/* Weight / Value / Rarity / Source */}
      <ItemMetaChips
        weight={weapon.weight}
        value={weapon.value}
        rarity={weapon.rarity}
        source={weapon.source}
        className="flex flex-wrap gap-1.5 border-t border-slate-800 pt-2 mt-1"
      />

      {isThrown && (
        <div className="border-t border-slate-800 pt-2 flex items-center justify-between gap-2">
          <span className="text-[10px] text-slate-500 uppercase tracking-wide">Quantity</span>
          <QuantityControl
            quantity={weapon.quantity ?? 1}
            editable={editable}
            size="sm"
            onUpdate={onUpdateQuantity}
          />
        </div>
      )}

      {/* Attachments */}
      {(attachmentRefs.length > 0 || (editable && visibleCompatible.length > 0)) && (
        <div className="border-t border-slate-800 pt-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase tracking-wide">
              Attachments
            </span>
            {editable && visibleCompatible.length > 0 && (
              <button
                onClick={() => setShowAttachPicker(true)}
                className="text-xs text-amber-400 hover:text-amber-300"
              >
                + Add
              </button>
            )}
          </div>
          {attachmentRefs.length === 0 ? (
            <p className="text-xs text-slate-600 italic">None fitted</p>
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

      {showQualities && (
        <SpecialRulesModal
          rules={effective.specialRules ?? ""}
          title="Qualities"
          onClose={() => setShowQualities(false)}
        />
      )}

      {showItemRules && rulesDescription && (
        <SpecialRulesModal
          rules=""
          description={rulesDescription}
          title="Rules"
          onClose={() => setShowItemRules(false)}
        />
      )}

      {showAttachPicker && (
        <AttachmentPicker
          compatibleUpgrades={visibleCompatible}
          onSelect={(id) => {
            onAddAttachment(id);
            setShowAttachPicker(false);
          }}
          onClose={() => setShowAttachPicker(false)}
        />
      )}
      </>)}
    </div>
  );
}
