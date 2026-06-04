// src/pages/characterSheet/weapons/RangedCard.tsx
// RangedPicker, CustomRangedForm, RangedCard — co-located for navigability.

import { useState } from "react";
import type { RangedWeapon, WeaponAmmoEntry, GrenadeItem } from "../../../types/Character";
import {
  RANGED_WEAPON_REFERENCE,
  type RangedWeaponRef,
} from "../../../data/reference/weaponReference";
import { AMMO_REFERENCE } from "../../../data/reference/ammoReference";
import { WEAPON_UPGRADE_REFERENCE } from "../../../data/reference/weaponUpgradeReference";
import { editableInputClass, sectionContainerClass } from "../../../ui/editableStyles";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { PickerModal } from "../../../ui/PickerModal";
import { QuantityControl } from "../../../ui/QuantityControl";
import { InfoModal } from "../../../components/InfoModal";
import {
  StatChip,
  DamageTypeChip,
  SpecialRulesModal,
  SpecialRulesContent,
  AttachmentPicker,
  AttachmentCard,
} from "./weaponShared";
import { WEAPON_SPECIAL_RULES } from "../../../data/reference/weaponSpecialRules";
import { effectiveRangedStats, getCompatibleUpgrades } from "./weaponHelpers";

// ─── Ranged Picker ────────────────────────────────────────────────────────────

export function RangedPicker({
  onSelect,
  onCustom,
  onClose,
  references = RANGED_WEAPON_REFERENCE,
  title = "Add Ranged Weapon",
  placeholder = "Search weapons…",
  showCustom = true,
}: {
  onSelect: (ref: RangedWeaponRef) => void;
  onCustom: () => void;
  onClose: () => void;
  references?: RangedWeaponRef[];
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
      footer={showCustom ? (
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
    name: "", class: "", damage: "", pen: "", range: "", rof: "", clip: "", rld: "", weight: "", specialRules: "",
  });

  const makeFieldSetter =
    (k: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setFields((prev) => ({ ...prev, [k]: e.target.value }));

  return (
    <div className="border border-amber-500/30 bg-slate-900/60 rounded-lg p-4 space-y-3">
      <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
        Custom Ranged Weapon
      </p>
      <div className="grid grid-cols-2 gap-2">
        {(
          ["name", "class", "range", "rof", "damage", "pen", "clip", "rld", "weight", "specialRules"] as const
        ).map((k) => (
          <div key={k} className={k === "name" || k === "specialRules" ? "col-span-2" : ""}>
            <label className="text-xs font-medium uppercase tracking-wide text-slate-100">
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
          className="px-4 py-1.5 rounded border border-slate-500 bg-slate-800 hover:bg-slate-700 text-sm text-slate-100"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Ammo Entry Row ───────────────────────────────────────────────────────────

function AmmoEntryRow({
  entry,
  editable,
  clipSize,
  weightKg,
  onSetLoaded,
  onRemove,
  onUpdateClips,
  onUpdateRounds,
}: {
  entry: WeaponAmmoEntry;
  editable: boolean;
  clipSize?: string;
  weightKg?: number;
  onSetLoaded: () => void;
  onRemove: () => void;
  onUpdateClips: (qty: number) => void;
  onUpdateRounds: (qty: number) => void;
}) {
  const ammoRef = entry.referenceId
    ? AMMO_REFERENCE.find((ammo) => ammo.id === entry.referenceId)
    : undefined;
  const clipSizeLabel =
    clipSize && clipSize !== "0" && clipSize !== "—" && clipSize !== "N/A"
      ? `${clipSize}/clip`
      : undefined;

  return (
    <div className="rounded bg-slate-800/60 px-2.5 py-2 space-y-1.5">
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
          <span className="text-xs text-slate-200 truncate">{entry.name}</span>
          {entry.loaded && (
            <span className="text-[10px] text-green-500 uppercase tracking-wide shrink-0">
              Loaded
            </span>
          )}
        </div>
        {editable && (
          <button
            onClick={onRemove}
            className="text-xs text-red-400 hover:text-red-300 shrink-0 leading-none"
          >
            ×
          </button>
        )}
      </div>

      {(ammoRef || clipSizeLabel) && (
        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
          {clipSizeLabel && (
            <span className="rounded border border-slate-700 bg-slate-900/40 px-1.5 py-0.5 text-slate-400">
              {clipSizeLabel}
            </span>
          )}
          {ammoRef && (
            <>
              <span className="rounded border border-slate-700 bg-slate-900/40 px-1.5 py-0.5 text-amber-400/80 font-mono">
                ₮ {ammoRef.cost}
              </span>
              <span className="rounded border border-slate-700 bg-slate-900/40 px-1.5 py-0.5 text-slate-400">
                per {ammoRef.purchaseAmount}
              </span>
            </>
          )}
        </div>
      )}

      {/* Clips + Rounds + Weight */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500 uppercase tracking-wide">Clips</span>
          <QuantityControl
            quantity={entry.clips}
            editable={editable}
            size="sm"
            onUpdate={onUpdateClips}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500 uppercase tracking-wide">Rounds</span>
          <QuantityControl
            quantity={entry.rounds}
            editable={editable}
            size="sm"
            onUpdate={onUpdateRounds}
          />
        </div>
        {(weightKg ?? 0) > 0 && (
          <span className="text-[10px] text-slate-500 ml-auto">{formatWeight(weightKg!)} kg</span>
        )}
      </div>
    </div>
  );
}

// ─── Ammo Picker ──────────────────────────────────────────────────────────────

function AmmoPicker({
  compatibleIds,
  existingNames,
  onSelect,
  onClose,
}: {
  compatibleIds?: string[];
  existingNames: Set<string>;
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
      title="Add Ammo Type"
      placeholder="Search ammo…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={options.length === 0}
    >
      {options.map((ammo) => (
        <button
          key={ammo.id}
          onClick={() => {
            onSelect(ammo.name, ammo.id);
            onClose();
          }}
          disabled={existingNames.has(ammo.name)}
          className="w-full text-left px-4 py-3 hover:bg-slate-800 transition group disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-200 group-hover:text-white">
              {ammo.name}
            </span>
            <div className="flex items-center gap-1.5 text-xs shrink-0">
              <span className="text-slate-500">{ammo.rarity}</span>
              <span className="text-slate-600">·</span>
              <span className="text-amber-400/80 font-mono">₮ {ammo.cost}</span>
              <span className="text-slate-500">/ {ammo.purchaseAmount}</span>
            </div>
          </div>
          {ammo.description && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{ammo.description}</p>
          )}
        </button>
      ))}

      {/* Custom / unlisted ammo */}
      <div className="px-4 py-3 border-t border-slate-800 space-y-2">
        <p className="text-xs text-slate-500">Custom / unlisted ammo</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Ammo name…"
            className="flex-1 text-sm bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-100 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={() => {
              if (customName.trim()) {
                onSelect(customName.trim());
                onClose();
              }
            }}
            disabled={!customName.trim() || existingNames.has(customName.trim())}
            className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-sm text-slate-900 font-semibold"
          >
            Add
          </button>
        </div>
      </div>
    </PickerModal>
  );
}

// ─── Ammo Weight ─────────────────────────────────────────────────────────────
// CR rule: a full clip weighs 10% of the weapon's weight.

function calcEntryWeight(weapon: RangedWeapon, entry: WeaponAmmoEntry): number {
  const weaponKg = parseFloat(weapon.weight ?? "0");
  if (!weaponKg) return 0;
  const clipSize = parseFloat(weapon.clip ?? "1") || 1;
  const clipWeight = weaponKg * 0.1;
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
  allowAttachments = true,
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
  allowAttachments?: boolean;
}) {
  const [showQualities, setShowQualities] = useState(false);
  const [showItemRules, setShowItemRules] = useState(false);
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
  const baseWeapon = weaponRef ? { ...weapon, specialRules: weaponRef.specialRules } : weapon;
  const effective = effectiveRangedStats(baseWeapon, attachmentRefs);
  const compatible = getCompatibleUpgrades(
    weapon.class ?? "",
    weapon.name,
    false,
    attachmentIds
  );
  const visibleCompatible = allowAttachments ? compatible : [];

  const rulesText = effective.specialRules?.trim() ?? "";
  const hasRules = Boolean(rulesText && rulesText !== "—" && rulesText !== "-");
  const ruleNamesInLookup = (effective.specialRules ?? "")
    .split(",")
    .map((r) => r.trim().replace(/\s*\(.*?\)/, ""))
    .filter((name) => Boolean(name) && Boolean(WEAPON_SPECIAL_RULES[name]));
  const rulesDescription = weaponRef?.description ?? weapon.description;
  const hasModal = !!rulesDescription || ruleNamesInLookup.length > 0;
  const rulesDisplayText = hasRules ? rulesText : hasModal ? "Special rules" : "";
  const hasQualities = Boolean(
    rulesText && rulesText !== "—" && rulesText !== "-" && rulesText !== "â€”"
  );
  const hasQualityModal = ruleNamesInLookup.length > 0;
  const hasItemRules = !!rulesDescription;

  const isThrown =
    weapon.class?.toLowerCase().includes("thrown") ||
    weaponRef?.class.toLowerCase().includes("thrown");
  const isGrenadeLauncher =
    weapon.referenceId === "cr-grenade-launcher" ||
    weapon.referenceId === "cr-rpg-launcher";
  const hasAmmo = !isThrown && !isGrenadeLauncher && !!(weaponRef?.ammoType || weapon.custom);

  const ammoEntries = weapon.ammoEntries ?? [];
  const existingAmmoNames = new Set(ammoEntries.map((e) => e.name));

  // ── Ammo helpers ────────────────────────────────────────────────────────────

  function handleAddAmmo(name: string, referenceId?: string) {
    const isFirst = ammoEntries.length === 0;
    onUpdateAmmoEntries([
      ...ammoEntries,
      {
        id: crypto.randomUUID(),
        referenceId,
        name,
        clips: 0,
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

      {/* Thrown weapon: quantity counter */}
      {isThrown && (
        <div className="border-t border-slate-800 pt-2 flex items-center justify-between gap-2">
          <span className="text-[10px] text-slate-500 uppercase tracking-wide">Quantity</span>
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
          <span className="text-[10px] text-slate-500 uppercase tracking-wide">Grenades</span>
          {(grenades ?? []).length === 0 ? (
            <p className="text-xs text-slate-600 italic">
              No grenades — add via the Grenades section below.
            </p>
          ) : (
            <div className="space-y-1.5">
              {(grenades ?? []).map((g) => (
                <div
                  key={g.id}
                  className="rounded bg-slate-800/60 px-2.5 py-2 flex items-center justify-between gap-2"
                >
                  <span className="text-xs text-slate-200 truncate">{g.name}</span>
                  <QuantityControl
                    quantity={g.quantity}
                    editable={editable}
                    size="sm"
                    onUpdate={(qty) =>
                      onUpdateGrenades?.(
                        (grenades ?? []).map((x) => (x.id === g.id ? { ...x, quantity: qty } : x))
                      )
                    }
                  />
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
            <span className="text-[10px] text-slate-500 uppercase tracking-wide">Ammo</span>
            {editable && (
              <button
                onClick={() => setShowAmmoPicker(true)}
                className="text-xs text-amber-400 hover:text-amber-300"
              >
                + Add
              </button>
            )}
          </div>

          {ammoEntries.length === 0 ? (
            <p className="text-xs text-slate-600 italic">No ammo tracked</p>
          ) : (
            <div className="space-y-1.5">
              {ammoEntries.map((entry) => (
                <AmmoEntryRow
                  key={entry.id}
                  entry={entry}
                  editable={editable}
                  clipSize={weapon.clip}
                  weightKg={calcEntryWeight(weapon, entry)}
                  onSetLoaded={() => handleSetLoaded(entry.id)}
                  onRemove={() => handleRemoveAmmo(entry.id)}
                  onUpdateClips={(qty) => handleUpdateEntry(entry.id, { clips: qty })}
                  onUpdateRounds={(qty) => handleUpdateEntry(entry.id, { rounds: qty })}
                />
              ))}
            </div>
          )}
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

      {/* Modals */}
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

      {showAmmoPicker && (
        <AmmoPicker
          compatibleIds={weaponRef?.compatibleAmmoIds}
          existingNames={existingAmmoNames}
          onSelect={handleAddAmmo}
          onClose={() => setShowAmmoPicker(false)}
        />
      )}
    </div>
  );
}
