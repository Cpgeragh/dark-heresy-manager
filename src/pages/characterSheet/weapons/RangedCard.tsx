// src/pages/characterSheet/weapons/RangedCard.tsx
// RangedPicker, CustomRangedForm, RangedCard — co-located for navigability.

import { useState } from "react";
import type { RangedWeapon } from "../../../types/Character";
import {
  RANGED_WEAPON_REFERENCE,
  type RangedWeaponRef,
} from "../../../data/reference/weaponReference";
import { WEAPON_UPGRADE_REFERENCE } from "../../../data/reference/weaponUpgradeReference";
import { editableInputClass, sectionContainerClass } from "../../../ui/editableStyles";
import { sourceColour } from "../../../ui/sourceStyles";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { PickerModal } from "../../../ui/PickerModal";
import { InfoModal } from "../../../components/InfoModal";
import {
  StatChip,
  DamageTypeChip,
  SpecialRulesModal,
  AttachmentPicker,
} from "./weaponShared";
import { effectiveRangedStats, getCompatibleUpgrades } from "./weaponHelpers";

// ─── Ranged Picker ────────────────────────────────────────────────────────────

export function RangedPicker({
  onSelect,
  onCustom,
  onClose,
}: {
  onSelect: (ref: RangedWeaponRef) => void;
  onCustom: () => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = RANGED_WEAPON_REFERENCE.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <PickerModal
      title="Add Ranged Weapon"
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
            <span className="text-xs text-slate-500 shrink-0">{ref.class}</span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5 font-mono">
            {ref.range} · {ref.rof} · {ref.damage} · Pen {ref.pen} · Clip {ref.clip}
          </div>
        </button>
      ))}
    </PickerModal>
  );
}

// ─── Custom Ranged Form ───────────────────────────────────────────────────────

export function CustomRangedForm({
  onAdd,
  onCancel,
}: {
  onAdd: (w: RangedWeapon) => void;
  onCancel: () => void;
}) {
  const [fields, setFields] = useState<Omit<RangedWeapon, "id" | "custom">>({
    name: "", class: "", damage: "", pen: "", range: "", rof: "", clip: "", rld: "", specialRules: "",
  });

  const makeFieldSetter =
    (k: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setFields((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="border border-amber-500/30 bg-slate-900/60 rounded-lg p-4 space-y-3">
      <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
        Custom Ranged Weapon
      </p>
      <div className="grid grid-cols-2 gap-2">
        {(
          ["name", "class", "range", "rof", "damage", "pen", "clip", "rld", "specialRules"] as const
        ).map((k) => (
          <div key={k} className={k === "name" || k === "specialRules" ? "col-span-2" : ""}>
            <label className="text-xs text-slate-400 capitalize">
              {k === "rld" ? "Reload" : k}
            </label>
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

// ─── Ranged Card ──────────────────────────────────────────────────────────────

export function RangedCard({
  weapon,
  editable,
  onRemove,
  onAddAttachment,
  onRemoveAttachment,
}: {
  weapon: RangedWeapon;
  editable: boolean;
  onRemove: () => void;
  onAddAttachment: (upgradeId: string) => void;
  onRemoveAttachment: (upgradeId: string) => void;
}) {
  const [showRules, setShowRules] = useState(false);
  const [showAttachPicker, setShowAttachPicker] = useState(false);

  const attachmentIds = weapon.attachments ?? [];
  const attachmentRefs = WEAPON_UPGRADE_REFERENCE.filter((u) =>
    attachmentIds.includes(u.id)
  );
  const effective = effectiveRangedStats(weapon, attachmentRefs);
  const compatible = getCompatibleUpgrades(
    weapon.class ?? "",
    weapon.name,
    false,
    attachmentIds
  );
  const hasRules = !!(effective.specialRules?.trim());

  return (
    <div className={sectionContainerClass(editable) + " space-y-3"}>
      {/* Header */}
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

      {/* Stats grid */}
      <div className="flex flex-wrap gap-1.5">
        {effective.range && <StatChip label="Range" value={effective.range} />}
        {weapon.rof && <StatChip label="RoF" value={weapon.rof} />}
        {effective.damage && (
          <StatChip
            label="Damage"
            value={effective.damage.replace(/\s*[IREX]$/i, "").trim()}
          />
        )}
        {effective.damage && <DamageTypeChip damage={effective.damage} />}
        {effective.pen && <StatChip label="Pen" value={effective.pen} />}
        {effective.clip && <StatChip label="Clip" value={effective.clip} />}
        {weapon.rld && <StatChip label="Reload" value={weapon.rld} />}
      </div>

      {/* Special rules */}
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
              {attachmentRefs.map((u) => (
                <div
                  key={u.id}
                  className="bg-slate-800/60 rounded border border-slate-700 px-2 py-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-300">{u.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <InfoModal
                        title={u.name}
                        content={
                          <div className="space-y-2">
                            <p className="text-sm text-slate-300 leading-relaxed">
                              {u.description}
                            </p>
                            <p className="text-xs text-slate-500 italic">
                              {u.applicableTo}
                            </p>
                          </div>
                        }
                      />
                      {editable && (
                        <button
                          onClick={() => onRemoveAttachment(u.id)}
                          className="text-slate-500 hover:text-red-400 leading-none text-sm"
                          title={`Remove ${u.name}`}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {u.weightModifier !== "—" && (
                      <span className="text-[10px] rounded border border-slate-700 bg-slate-900/40 px-1 py-0.5 text-slate-400">
                        ⚖ {u.weightModifier}
                      </span>
                    )}
                    <span className="text-[10px] rounded border border-slate-700 bg-slate-900/40 px-1 py-0.5 text-amber-400/80 font-mono">
                      ₮ {u.value}
                    </span>
                    <span
                      className={`text-[10px] rounded border bg-slate-900/40 px-1 py-0.5 font-mono ${sourceColour(u.source)}`}
                    >
                      {u.source}
                    </span>
                  </div>
                </div>
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
