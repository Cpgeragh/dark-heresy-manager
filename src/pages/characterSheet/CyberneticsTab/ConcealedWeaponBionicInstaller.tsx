import { useState } from "react";
import type { CyberneticItem, MeleeWeapon, RangedWeapon } from "../../../types/Character";
import { resolveMeleeWeaponReference } from "../../../data/reference/weaponReference";
import { Button } from "../../../ui/Button";
import { ModalHeader } from "../../../ui/ModalHeader";
import { ModalShell } from "../../../ui/ModalShell";
import { uiTextPlaceholder } from "../../../ui/editableStyles";
import { ImplantRow } from "./ImplantRow";
import { RangedCard } from "../weapons/RangedCard";
import { MeleeCard } from "../weapons/MeleeCard";

type WeaponChoice = { id: string; type: "ranged" | "melee"; name: string };

export function ConcealedWeaponBionicInstaller({
  cybernetics, rangedWeapons, meleeWeapons, strengthBonus, onInstall, onClose,
}: {
  cybernetics: CyberneticItem[];
  rangedWeapons: RangedWeapon[]; meleeWeapons: MeleeWeapon[];
  strengthBonus: number;
  onInstall: (armId: string, weapon: WeaponChoice) => void; onClose: () => void;
}) {
  const [armId, setArmId] = useState<string | null>(null);
  const arms = cybernetics.filter((item) => item.referenceId === "cr-bionic-arm");
  const weapons: WeaponChoice[] = [
    ...rangedWeapons.filter((weapon) => weapon.class?.toLowerCase().includes("pistol") && !weapon.concealedBionic)
      .map((weapon) => ({ id: weapon.id, type: "ranged" as const, name: weapon.name })),
    ...meleeWeapons.filter((weapon) => {
      const ref = resolveMeleeWeaponReference(weapon.referenceId);
      return !weapon.concealedBionic && !ref?.twoHanded;
    }).map((weapon) => ({ id: weapon.id, type: "melee" as const, name: weapon.name })),
  ].sort((a, b) => a.name.localeCompare(b.name));
  const selectingArm = !armId;
  return <ModalShell ariaLabel="Install Concealed Weapon Bionic" onClose={onClose} className="max-w-md lg:max-w-lg overflow-y-auto">
    <ModalHeader title="Concealed Weapon Bionic" onClose={onClose} />
    <div className="p-4 lg:p-5 space-y-3">
      <p className="text-sm text-slate-300">{selectingArm ? "Choose the existing Bionic Arm that will house the weapon." : "Choose an unmodified pistol or one-handed melee weapon."}</p>
      {selectingArm && arms.length === 0 && <p className={uiTextPlaceholder}>Install a Bionic Arm before installing this upgrade.</p>}
      {!selectingArm && weapons.length === 0 && <p className={uiTextPlaceholder}>Add an eligible weapon before installing this upgrade.</p>}
      {selectingArm
        ? arms.map((item) => (
            <div key={item.id} className="space-y-2">
              <ImplantRow item={item} editable={false} onCycleQuality={() => {}} onRemove={() => {}} />
              <Button size="sm" onClick={() => setArmId(item.id)}>Select Bionic Arm</Button>
            </div>
          ))
        : weapons.map((item) => {
            const ranged = item.type === "ranged" ? rangedWeapons.find((weapon) => weapon.id === item.id) : undefined;
            const melee = item.type === "melee" ? meleeWeapons.find((weapon) => weapon.id === item.id) : undefined;
            return <div key={item.id} className="space-y-2">
              {ranged && <RangedCard weapon={ranged} editable={false} forceExpanded allowUpgrades={false} onRemove={() => {}} onAddUpgrade={() => {}} onRemoveUpgrade={() => {}} onUpdateAmmoEntries={() => {}} onUpdateQuantity={() => {}} />}
              {melee && <MeleeCard weapon={melee} editable={false} forceExpanded allowUpgrades={false} strengthBonus={strengthBonus} onRemove={() => {}} onAddUpgrade={() => {}} onRemoveUpgrade={() => {}} onUpdateQuantity={() => {}} />}
              <Button size="sm" onClick={() => onInstall(armId!, item)}>Select Weapon</Button>
            </div>;
          })}
    </div>
    <div className="p-4 border-t border-slate-700 flex gap-2">
      {!selectingArm && <Button size="sm" onClick={() => setArmId(null)}>Back</Button>}
      <Button size="sm" onClick={onClose}>Cancel</Button>
    </div>
  </ModalShell>;
}
