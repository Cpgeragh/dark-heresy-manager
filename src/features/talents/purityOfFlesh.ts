import { CYBERNETICS_REFERENCE } from "../../data/reference/cyberneticsReference";
import type {
  ArcheotechItem,
  CyberneticItem,
  MeleeWeapon,
  RangedWeapon,
} from "../../types/Character";
import {
  isIntegratedMeleeWeapon,
  isIntegratedRangedWeapon,
} from "../../utils/weaponUtils";

export interface PurityRemovalItem {
  key: string;
  name: string;
  kind: "Implant" | "Integrated Weapon" | "Archeotech";
  qualifiesForFate: boolean;
}

function isMechadendriteName(name: string): boolean {
  return name.toLocaleLowerCase().includes("mechadendrite");
}

export function isMechadendrite(item: CyberneticItem): boolean {
  const referenceName = CYBERNETICS_REFERENCE.find(
    (reference) => reference.id === item.referenceId
  )?.name;
  return isMechadendriteName(referenceName ?? item.name);
}

export function isPurityArcheotech(item: ArcheotechItem): boolean {
  return item.type === "Cybernetic" || item.type === "Integrated Weapon";
}

export function getPurityRemovalInventory(
  cybernetics: readonly CyberneticItem[],
  rangedWeapons: readonly RangedWeapon[],
  meleeWeapons: readonly MeleeWeapon[],
  archeotech: readonly ArcheotechItem[]
): PurityRemovalItem[] {
  return [
    ...cybernetics.map((item) => ({
      key: `cybernetic:${item.id}`,
      name: item.name,
      kind: "Implant" as const,
      qualifiesForFate: !isMechadendrite(item),
    })),
    ...rangedWeapons.filter(isIntegratedRangedWeapon).map((item) => ({
      key: `ranged:${item.id}`,
      name: item.name,
      kind: "Integrated Weapon" as const,
      qualifiesForFate: true,
    })),
    ...meleeWeapons.filter(isIntegratedMeleeWeapon).map((item) => ({
      key: `melee:${item.id}`,
      name: item.name,
      kind: "Integrated Weapon" as const,
      qualifiesForFate: true,
    })),
    ...archeotech.filter(isPurityArcheotech).map((item) => ({
      key: `archeotech:${item.id}`,
      name: item.name,
      kind: "Archeotech" as const,
      qualifiesForFate: !isMechadendriteName(item.name),
    })),
  ];
}

export function getPurityFatePoints(inventory: readonly PurityRemovalItem[]): number {
  const qualifying = inventory.filter((item) => item.qualifiesForFate).length;
  return Math.floor(qualifying / 2);
}
