import { describe, expect, it } from "vitest";
import { indexReferences } from "../../src/utils/referenceIndex";
import {
  RANGED_WEAPON_REFERENCE,
  MELEE_WEAPON_REFERENCE,
  GRENADE_REFERENCE,
  resolveRangedWeaponReference,
  resolveMeleeWeaponReference,
  resolveGrenadeReference,
  findRangedWeaponReference,
} from "../../src/data/reference/weaponReference";
import { AMMO_REFERENCE, resolveAmmoReference } from "../../src/data/reference/ammoReference";
import {
  WEAPON_UPGRADE_REFERENCE,
  resolveWeaponUpgrades,
} from "../../src/data/reference/weaponUpgradeReference";

describe("weapon reference indexes", () => {
  it("retains the first object when IDs repeat", () => {
    const first = { id: "same" };
    expect(indexReferences([first, { id: "same" }]).get("same")).toBe(first);
  });

  it("matches the original searches across every reference", () => {
    for (const [references, resolve] of [
      [RANGED_WEAPON_REFERENCE, resolveRangedWeaponReference],
      [MELEE_WEAPON_REFERENCE, resolveMeleeWeaponReference],
      [GRENADE_REFERENCE, resolveGrenadeReference],
      [AMMO_REFERENCE, resolveAmmoReference],
    ] as const) {
      for (const reference of references) {
        expect(resolve(reference.id)).toBe(references.find((entry) => entry.id === reference.id));
      }
      expect(resolve(undefined)).toBeUndefined();
      expect(resolve("")).toBeUndefined();
      expect(resolve("missing-reference")).toBeUndefined();
    }
  });

  it("preserves retired IDs", () => {
    expect(resolveRangedWeaponReference("ih-heavy-flamer")).toBe(
      resolveRangedWeaponReference("heavy-flamer")
    );
    expect(resolveMeleeWeaponReference("ih-eviscerator")).toBe(
      resolveMeleeWeaponReference("eviscerator")
    );
  });

  it("preserves name and optional source matching", () => {
    for (const reference of RANGED_WEAPON_REFERENCE) {
      for (const source of [undefined, reference.source, "missing-source"]) {
        expect(findRangedWeaponReference(reference.name, source)).toBe(
          RANGED_WEAPON_REFERENCE.find(
            (entry) => entry.name === reference.name && (!source || entry.source === source)
          )
        );
      }
    }
    expect(findRangedWeaponReference("missing-weapon")).toBeUndefined();
  });

  it("preserves upgrade reference order, ignores missing IDs, and deduplicates installed IDs", () => {
    const ids = WEAPON_UPGRADE_REFERENCE.map((entry) => entry.id).reverse();
    ids.push(ids[0], "missing-upgrade");
    const expected = WEAPON_UPGRADE_REFERENCE.filter((entry) => ids.includes(entry.id));
    const actual = resolveWeaponUpgrades(ids);
    expect(actual).toEqual(expected);
    actual.forEach((reference, index) => expect(reference).toBe(expected[index]));
    expect(resolveWeaponUpgrades([])).toEqual([]);
  });
});
