// src/pages/characterSheet/weapons/MeleeCard.tsx
// MeleePicker, CustomMeleeForm, MeleeCard — co-located for navigability.

import { useState } from "react";
import type { MeleeWeapon } from "../../../types/Character";
import {
  MELEE_WEAPON_REFERENCE,
  type MeleeWeaponRef,
} from "../../../data/reference/weaponReference";
import { WEAPON_UPGRADE_REFERENCE } from "../../../data/reference/weaponUpgradeReference";
import { editableInputClass, sectionContainerClass } from "../../../ui/editableStyles";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { PickerModal } from "../../../ui/PickerModal";
import {
  StatChip,
  DamageTypeChip,
  computeMeleeTotalDamage,
  SpecialRulesModal,
  AttachmentPicker,
  AttachmentCard,
} from "./weaponShared";
import { effectiveMeleeStats, getCompatibleUpgrades } from "./weaponHelpers";

// ─── Melee Picker ─────────────────────────────────────────────────────────────

export function MeleePicker({
  onSelect,
  onCustom,
  onClose,
}: {
  onSelect: (ref: MeleeWeaponRef) => void;
  onCustom: () => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = MELEE_WEAPON_REFERENCE.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <PickerModal
      title="Add Melee Weapon"
      placeholder="Search weapons…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={filtered.length === 0}
      footer={
        <button
          onClick={onCustom}
          className="w-full text-sm text-amber-400 hover:text-amber-300 text-center py-1"
        >
          + Add custom weapon
        </button>
      }
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
            <span className="text-xs text-slate-500 shrink-0">
              {ref.twoHanded ? "Two-Handed" : ref.class}
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5 font-mono">
            {ref.damage} · Pen {ref.pen}
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
            <label className="text-xs text-slate-400 capitalize">{k}</label>
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
          onClick={() => onAdd({ id: crypto.randomUUID(), custom: true, ...fields })}
          disabled={!fields.name?.trim()}
          className="flex-1 py-1.5 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-sm text-slate-900 font-semibold"
        >
          Add
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-1.5 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 text-sm text-slate-300"
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
}: {
  weapon: MeleeWeapon;
  editable: boolean;
  strengthBonus: number;
  onRemove: () => void;
  onAddAttachment: (upgradeId: string) => void;
  onRemoveAttachment: (upgradeId: string) => void;
}) {
  const [showRules, setShowRules] = useState(false);
  const [showAttachPicker, setShowAttachPicker] = useState(false);

  const attachmentIds = weapon.attachments ?? [];
  const attachmentRefs = WEAPON_UPGRADE_REFERENCE.filter((upgrade) =>
    attachmentIds.includes(upgrade.id)
  );
  const effective = effectiveMeleeStats(weapon, attachmentRefs);
  const compatible = getCompatibleUpgrades(
    weapon.class ?? "",
    weapon.name,
    true,
    attachmentIds
  );
  const hasRules = !!(effective.specialRules?.trim());

  return (
    <div className={sectionContainerClass(editable) + " space-y-3"}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-200">{weapon.name}</p>
          {weapon.class && (
            <p className="text-xs text-slate-500">{weapon.class}</p>
          )}
        </div>
        {editable && (
          <button
            onClick={onRemove}
            className="text-xs text-red-400 hover:text-red-300 shrink-0"
          >
            Remove
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {weapon.damage && (
          <StatChip
            label="Damage"
            value={weapon.damage.replace(/\s*[IREX]$/i, "").trim()}
          />
        )}
        {weapon.damage && <DamageTypeChip damage={weapon.damage} />}
        {effective.pen && <StatChip label="Pen" value={effective.pen} />}
        <StatChip label="SB" value={`+${strengthBonus}`} />
        {weapon.damage && (
          <StatChip
            label="Total"
            value={computeMeleeTotalDamage(weapon.damage, strengthBonus)}
          />
        )}
      </div>

      {hasRules && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 italic flex-1">
            {effective.specialRules}
          </span>
          <button
            onClick={() => setShowRules(true)}
            title="Explain special rules"
            className="text-slate-500 hover:text-amber-400 text-sm transition"
          >
            ⓘ
          </button>
        </div>
      )}

      {/* Weight / Value / Rarity / Source */}
      <ItemMetaChips
        weight={weapon.weight}
        value={weapon.value}
        rarity={weapon.rarity}
        source={weapon.source}
        className="flex flex-wrap gap-1.5 border-t border-slate-800 pt-2 mt-1"
      />

      {/* Attachments */}
      {(attachmentRefs.length > 0 || (editable && compatible.length > 0)) && (
        <div className="border-t border-slate-800 pt-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase tracking-wide">
              Attachments
            </span>
            {editable && compatible.length > 0 && (
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

      {showRules && effective.specialRules && (
        <SpecialRulesModal
          rules={effective.specialRules}
          onClose={() => setShowRules(false)}
        />
      )}

      {showAttachPicker && (
        <AttachmentPicker
          compatibleUpgrades={compatible}
          onSelect={(id) => {
            onAddAttachment(id);
            setShowAttachPicker(false);
          }}
          onClose={() => setShowAttachPicker(false)}
        />
      )}
    </div>
  );
}
