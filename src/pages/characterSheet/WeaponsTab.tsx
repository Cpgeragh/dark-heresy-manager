// src/pages/characterSheet/WeaponsTab.tsx
// Orchestration layer: state management and layout for all weapon categories.
// Card components, pickers and helpers live in ./weapons/.

import { useState, useCallback } from "react";
import type {
  RangedWeapon,
  MeleeWeapon,
  AmmoItem,
  GrenadeItem,
  CyberneticItem,
  ShieldItem,
} from "../../types/Character";
import { CYBERNETICS_REFERENCE } from "../../data/reference/cyberneticsReference";
import {
  type RangedWeaponRef,
  type MeleeWeaponRef,
  type GrenadeRef,
  type ShieldRef,
} from "../../data/reference/weaponReference";
import type { AmmoRef } from "../../data/reference/ammoReference";
import { RangedCard, RangedPicker, CustomRangedForm } from "./weapons/RangedCard";
import { MeleeCard, MeleePicker, CustomMeleeForm } from "./weapons/MeleeCard";
import { AmmoCard, AmmoPicker, CustomAmmoForm } from "./weapons/AmmoCard";
import { GrenadeCard, GrenadePicker } from "./weapons/GrenadeCard";
import { ShieldCard, ShieldPicker } from "./weapons/ShieldCard";
import { CyberneticWeaponCard } from "./weapons/CyberneticWeaponCard";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeaponsTabProps {
  rangedWeapons: RangedWeapon[];
  meleeWeapons: MeleeWeapon[];
  ammo: AmmoItem[];
  grenades: GrenadeItem[];
  editable: boolean;
  strengthBonus: number;
  onUpdateRanged: (next: RangedWeapon[]) => void;
  onUpdateMelee: (next: MeleeWeapon[]) => void;
  onUpdateAmmo: (next: AmmoItem[]) => void;
  onUpdateGrenades: (next: GrenadeItem[]) => void;
  cybernetics?: CyberneticItem[];
  shields?: ShieldItem[];
  onUpdateShields?: (next: ShieldItem[]) => void;
}

type PickerTarget = "ranged" | "melee" | "ammo" | "grenades" | "shields" | null;

// ─── Main Component ───────────────────────────────────────────────────────────

export function WeaponsTab({
  rangedWeapons,
  meleeWeapons,
  ammo,
  grenades,
  editable,
  strengthBonus,
  onUpdateRanged,
  onUpdateMelee,
  onUpdateAmmo,
  onUpdateGrenades,
  cybernetics,
  shields,
  onUpdateShields,
}: WeaponsTabProps) {
  const [picker, setPicker] = useState<PickerTarget>(null);
  const [showCustomRanged, setShowCustomRanged] = useState(false);
  const [showCustomMelee, setShowCustomMelee] = useState(false);
  const [showCustomAmmo, setShowCustomAmmo] = useState(false);

  // ── Cybernetic weapons ─────────────────────────────────────────────────────
  const cyberneticWeaponItems = (cybernetics ?? []).flatMap((c) => {
    const ref = CYBERNETICS_REFERENCE.find((r) => r.id === c.referenceId);
    if (!ref?.weapon) return [];
    return [{ cybernetic: c, weapon: ref.weapon }];
  });

  // ── Grenade handlers ───────────────────────────────────────────────────────

  const addFromGrenadeRef = useCallback(
    (ref: GrenadeRef) => {
      if (!editable) return;
      onUpdateGrenades([
        ...grenades,
        {
          id: crypto.randomUUID(),
          referenceId: ref.id,
          name: ref.name,
          quantity: 1,
          class: ref.class,
          damage: ref.damage,
          pen: ref.pen,
          specialRules: ref.specialRules,
          weight: ref.weight,
          value: ref.value,
          rarity: ref.rarity,
          source: ref.source,
        },
      ]);
      setPicker(null);
    },
    [editable, grenades, onUpdateGrenades]
  );

  const removeGrenade = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdateGrenades(grenades.filter((g) => g.id !== id));
    },
    [editable, grenades, onUpdateGrenades]
  );

  const updateGrenadeQty = useCallback(
    (id: string, quantity: number) => {
      if (!editable) return;
      onUpdateGrenades(grenades.map((g) => (g.id === id ? { ...g, quantity } : g)));
    },
    [editable, grenades, onUpdateGrenades]
  );

  // ── Ranged handlers ────────────────────────────────────────────────────────

  const addFromRangedRef = useCallback(
    (ref: RangedWeaponRef) => {
      if (!editable) return;
      onUpdateRanged([
        ...rangedWeapons,
        {
          id: crypto.randomUUID(),
          referenceId: ref.id,
          name: ref.name,
          class: ref.class,
          range: ref.range,
          rof: ref.rof,
          damage: ref.damage,
          pen: String(ref.pen),
          clip: String(ref.clip),
          rld: ref.reload,
          specialRules: ref.specialRules,
          weight: ref.weight,
          value: ref.value,
          rarity: ref.rarity,
          source: ref.source,
        },
      ]);
      setPicker(null);
    },
    [editable, rangedWeapons, onUpdateRanged]
  );

  const addCustomRanged = useCallback(
    (w: RangedWeapon) => {
      if (!editable) return;
      onUpdateRanged([...rangedWeapons, w]);
      setShowCustomRanged(false);
    },
    [editable, rangedWeapons, onUpdateRanged]
  );

  const removeRanged = useCallback(
    (index: number) => {
      if (!editable) return;
      const next = [...rangedWeapons];
      next.splice(index, 1);
      onUpdateRanged(next);
    },
    [editable, rangedWeapons, onUpdateRanged]
  );

  const addAttachmentToRanged = useCallback(
    (weaponId: string, upgradeId: string) => {
      if (!editable) return;
      onUpdateRanged(
        rangedWeapons.map((w) =>
          w.id === weaponId
            ? { ...w, attachments: [...(w.attachments ?? []), upgradeId] }
            : w
        )
      );
    },
    [editable, rangedWeapons, onUpdateRanged]
  );

  const removeAttachmentFromRanged = useCallback(
    (weaponId: string, upgradeId: string) => {
      if (!editable) return;
      onUpdateRanged(
        rangedWeapons.map((w) =>
          w.id === weaponId
            ? { ...w, attachments: (w.attachments ?? []).filter((id) => id !== upgradeId) }
            : w
        )
      );
    },
    [editable, rangedWeapons, onUpdateRanged]
  );

  // ── Melee handlers ─────────────────────────────────────────────────────────

  const addFromMeleeRef = useCallback(
    (ref: MeleeWeaponRef) => {
      if (!editable) return;
      onUpdateMelee([
        ...meleeWeapons,
        {
          id: crypto.randomUUID(),
          referenceId: ref.id,
          name: ref.name,
          class: ref.twoHanded ? "Melee (Two-Handed)" : ref.class,
          damage: ref.damage,
          pen: String(ref.pen),
          specialRules: ref.specialRules,
          weight: ref.weight,
          value: ref.value,
          rarity: ref.rarity,
          source: ref.source,
        },
      ]);
      setPicker(null);
    },
    [editable, meleeWeapons, onUpdateMelee]
  );

  const addCustomMelee = useCallback(
    (w: MeleeWeapon) => {
      if (!editable) return;
      onUpdateMelee([...meleeWeapons, w]);
      setShowCustomMelee(false);
    },
    [editable, meleeWeapons, onUpdateMelee]
  );

  const removeMelee = useCallback(
    (index: number) => {
      if (!editable) return;
      const next = [...meleeWeapons];
      next.splice(index, 1);
      onUpdateMelee(next);
    },
    [editable, meleeWeapons, onUpdateMelee]
  );

  const addAttachmentToMelee = useCallback(
    (weaponId: string, upgradeId: string) => {
      if (!editable) return;
      onUpdateMelee(
        meleeWeapons.map((w) =>
          w.id === weaponId
            ? { ...w, attachments: [...(w.attachments ?? []), upgradeId] }
            : w
        )
      );
    },
    [editable, meleeWeapons, onUpdateMelee]
  );

  const removeAttachmentFromMelee = useCallback(
    (weaponId: string, upgradeId: string) => {
      if (!editable) return;
      onUpdateMelee(
        meleeWeapons.map((w) =>
          w.id === weaponId
            ? { ...w, attachments: (w.attachments ?? []).filter((id) => id !== upgradeId) }
            : w
        )
      );
    },
    [editable, meleeWeapons, onUpdateMelee]
  );

  // ── Ammo handlers ──────────────────────────────────────────────────────────

  const addFromAmmoRef = useCallback(
    (ref: AmmoRef) => {
      if (!editable) return;
      const numericAmount = Number(ref.purchaseAmount);
      onUpdateAmmo([
        ...ammo,
        {
          id: crypto.randomUUID(),
          referenceId: ref.id,
          name: ref.name,
          compatibleWith: ref.compatibleWith,
          amount: Number.isFinite(numericAmount) && numericAmount > 0 ? numericAmount : 1,
          value: `${ref.cost} / ${ref.purchaseAmount}`,
          rarity: ref.rarity,
          source: ref.source,
          description: ref.description,
        },
      ]);
      setPicker(null);
    },
    [editable, ammo, onUpdateAmmo]
  );

  const addCustomAmmo = useCallback(
    (item: AmmoItem) => {
      if (!editable) return;
      onUpdateAmmo([...ammo, item]);
      setShowCustomAmmo(false);
    },
    [editable, ammo, onUpdateAmmo]
  );

  const removeAmmo = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdateAmmo(ammo.filter((a) => a.id !== id));
    },
    [editable, ammo, onUpdateAmmo]
  );

  const updateAmmoAmount = useCallback(
    (id: string, amount: number) => {
      if (!editable) return;
      onUpdateAmmo(ammo.map((a) => (a.id === id ? { ...a, amount } : a)));
    },
    [editable, ammo, onUpdateAmmo]
  );

  // ── Shield handlers ────────────────────────────────────────────────────────

  const addFromShieldRef = useCallback(
    (ref: ShieldRef) => {
      if (!editable || !onUpdateShields) return;
      onUpdateShields([
        ...(shields ?? []),
        {
          id: crypto.randomUUID(),
          referenceId: ref.id,
          name: ref.name,
          ap: ref.ap,
          locations: ref.locations,
          damage: ref.damage,
          pen: String(ref.pen),
          specialRules: ref.specialRules,
          notes: ref.notes,
          weight: ref.weight,
          value: ref.value,
          rarity: ref.rarity,
          source: ref.source,
        },
      ]);
      setPicker(null);
    },
    [editable, shields, onUpdateShields]
  );

  const removeShield = useCallback(
    (id: string) => {
      if (!editable || !onUpdateShields) return;
      onUpdateShields((shields ?? []).filter((s) => s.id !== id));
    },
    [editable, shields, onUpdateShields]
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 text-slate-300">
      <h2 className="text-xl font-semibold">Weapons</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── RANGED ─────────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-200">Ranged</h3>
            {editable && !showCustomRanged && (
              <button
                onClick={() => setPicker("ranged")}
                className="text-xs px-3 py-1 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700"
              >
                + Add
              </button>
            )}
          </div>

          {rangedWeapons.length === 0 && !showCustomRanged && (
            <p className="text-sm text-slate-500 italic">No ranged weapons.</p>
          )}

          {rangedWeapons.map((w, i) => (
            <RangedCard
              key={w.id}
              weapon={w}
              editable={editable}
              onRemove={() => removeRanged(i)}
              onAddAttachment={(upgradeId) => addAttachmentToRanged(w.id, upgradeId)}
              onRemoveAttachment={(upgradeId) => removeAttachmentFromRanged(w.id, upgradeId)}
            />
          ))}

          {showCustomRanged && (
            <CustomRangedForm
              onAdd={addCustomRanged}
              onCancel={() => setShowCustomRanged(false)}
            />
          )}
        </section>

        {/* ── MELEE ──────────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-200">Melee</h3>
            {editable && !showCustomMelee && (
              <button
                onClick={() => setPicker("melee")}
                className="text-xs px-3 py-1 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700"
              >
                + Add
              </button>
            )}
          </div>

          {meleeWeapons.length === 0 && !showCustomMelee && (
            <p className="text-sm text-slate-500 italic">No melee weapons.</p>
          )}

          {meleeWeapons.map((w, i) => (
            <MeleeCard
              key={w.id}
              weapon={w}
              editable={editable}
              strengthBonus={strengthBonus}
              onRemove={() => removeMelee(i)}
              onAddAttachment={(upgradeId) => addAttachmentToMelee(w.id, upgradeId)}
              onRemoveAttachment={(upgradeId) => removeAttachmentFromMelee(w.id, upgradeId)}
            />
          ))}

          {showCustomMelee && (
            <CustomMeleeForm
              onAdd={addCustomMelee}
              onCancel={() => setShowCustomMelee(false)}
            />
          )}
        </section>

      </div>

      {/* ── SHIELDS ──────────────────────────────────────────────────────── */}
      {((shields ?? []).length > 0 || editable) && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-200">Shields</h3>
            {editable && (
              <button
                onClick={() => setPicker("shields")}
                className="text-xs px-3 py-1 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700"
              >
                + Add
              </button>
            )}
          </div>

          {(shields ?? []).length === 0 && (
            <p className="text-sm text-slate-500 italic">No shields carried.</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(shields ?? []).map((item) => (
              <ShieldCard
                key={item.id}
                item={item}
                editable={editable}
                onRemove={() => removeShield(item.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── AMMUNITION ───────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-200">
            Ammunition ({ammo.length})
          </h3>
          {editable && !showCustomAmmo && (
            <button
              onClick={() => setPicker("ammo")}
              className="text-xs px-3 py-1 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700"
            >
              + Add
            </button>
          )}
        </div>

        {ammo.length === 0 && !showCustomAmmo && (
          <p className="text-sm text-slate-500 italic">No ammunition tracked.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ammo.map((item) => (
            <AmmoCard
              key={item.id}
              item={item}
              editable={editable}
              onRemove={() => removeAmmo(item.id)}
              onUpdateAmount={(amount) => updateAmmoAmount(item.id, amount)}
            />
          ))}
        </div>

        {showCustomAmmo && (
          <CustomAmmoForm
            onAdd={addCustomAmmo}
            onCancel={() => setShowCustomAmmo(false)}
          />
        )}
      </section>

      {/* ── GRENADES ─────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-200">
            Grenades ({grenades.length})
          </h3>
          {editable && (
            <button
              onClick={() => setPicker("grenades")}
              className="text-xs px-3 py-1 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700"
            >
              + Add
            </button>
          )}
        </div>

        {grenades.length === 0 && (
          <p className="text-sm text-slate-500 italic">No grenades carried.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {grenades.map((item) => (
            <GrenadeCard
              key={item.id}
              item={item}
              editable={editable}
              onRemove={() => removeGrenade(item.id)}
              onUpdateQty={(qty) => updateGrenadeQty(item.id, qty)}
            />
          ))}
        </div>
      </section>

      {/* ── CYBERNETIC WEAPONS ────────────────────────────────────────────── */}
      {cyberneticWeaponItems.length > 0 && (
        <section className="space-y-3">
          <div>
            <h3 className="text-base font-semibold text-slate-200">
              Cybernetic Weapons
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Granted by installed implants — managed in the Cybernetics tab.
              Melee damage shown before Strength Bonus.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {cyberneticWeaponItems.map(({ cybernetic, weapon }) => (
              <CyberneticWeaponCard
                key={cybernetic.id}
                cyberneticName={cybernetic.name}
                weapon={weapon}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Pickers ───────────────────────────────────────────────────────── */}
      {picker === "ranged" && (
        <RangedPicker
          onSelect={addFromRangedRef}
          onCustom={() => {
            setPicker(null);
            setShowCustomRanged(true);
          }}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === "melee" && (
        <MeleePicker
          onSelect={addFromMeleeRef}
          onCustom={() => {
            setPicker(null);
            setShowCustomMelee(true);
          }}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === "ammo" && (
        <AmmoPicker
          onSelect={addFromAmmoRef}
          onCustom={() => {
            setPicker(null);
            setShowCustomAmmo(true);
          }}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === "grenades" && (
        <GrenadePicker
          onSelect={addFromGrenadeRef}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === "shields" && (
        <ShieldPicker
          onSelect={addFromShieldRef}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
