import { describe, it, expect } from "vitest";
import {
  modifyDamageBonus,
  halveRange,
  halveClip,
  modifyPen,
  addSpecialRule,
  removeSpecialRule,
  effectiveWeaponWeight,
  effectiveRangedStats,
  compatibleAmmoIdsWithIH,
  effectiveMeleeStats,
  getCompatibleUpgrades,
  weaponClassChip,
  ammoFamilyChip,
  compatibleAmmoIdsForAmmoType,
  rangedCraftsmanshipDescription,
  meleeClassChips,
  meleeCraftsmanshipDescription,
} from "../../src/pages/CharacterSheet/weapons/weaponHelpers";
import { WEAPON_UPGRADE_REFERENCE } from "../../src/data/reference/weaponUpgradeReference";
import { AMMO_REFERENCE } from "../../src/data/reference/ammoReference";
import { colourOrange, colourAmberFaint } from "../../src/ui/styles/colourTokens";
import type { RangedWeapon, MeleeWeapon } from "../../src/types/Character";

function upgrade(id: string) {
  const ref = WEAPON_UPGRADE_REFERENCE.find((u) => u.id === id);
  if (!ref) throw new Error(`Missing test fixture upgrade: ${id}`);
  return ref;
}

function ammo(id: string) {
  const ref = AMMO_REFERENCE.find((a) => a.id === id);
  if (!ref) throw new Error(`Missing test fixture ammo: ${id}`);
  return ref;
}

// ============================================================
// modifyDamageBonus
// ============================================================

describe("modifyDamageBonus", () => {
  it("increases the bonus by delta", () => {
    expect(modifyDamageBonus("1d10+3 I", 1)).toBe("1d10+4 I");
  });

  it("decreases the bonus by delta", () => {
    expect(modifyDamageBonus("1d10+3 I", -1)).toBe("1d10+2 I");
  });

  it("drops the bonus entirely when it reaches zero", () => {
    expect(modifyDamageBonus("1d10+1 I", -1)).toBe("1d10 I");
  });

  it("returns the original string when it doesn't match the expected format", () => {
    expect(modifyDamageBonus("invalid", 1)).toBe("invalid");
  });
});

// ============================================================
// halveRange
// ============================================================

describe("halveRange", () => {
  it("halves and rounds up an odd range", () => {
    expect(halveRange("15m")).toBe("8m");
  });

  it("halves an even range exactly", () => {
    expect(halveRange("20m")).toBe("10m");
  });

  it("returns the original string when it doesn't match the expected format", () => {
    expect(halveRange("Special")).toBe("Special");
  });
});

// ============================================================
// halveClip
// ============================================================

describe("halveClip", () => {
  it("halves and rounds up an odd clip size", () => {
    expect(halveClip("9")).toBe("5");
  });

  it("never returns less than 1", () => {
    expect(halveClip("1")).toBe("1");
  });

  it("returns the original string when it isn't a number", () => {
    expect(halveClip("N/A")).toBe("N/A");
  });
});

// ============================================================
// modifyPen
// ============================================================

describe("modifyPen", () => {
  it("adds delta to pen", () => {
    expect(modifyPen("2", 3)).toBe("5");
  });

  it("never returns less than 0", () => {
    expect(modifyPen("2", -5)).toBe("0");
  });

  it("returns the original string when it isn't a number", () => {
    expect(modifyPen("N/A", 2)).toBe("N/A");
  });
});

// ============================================================
// addSpecialRule
// ============================================================

describe("addSpecialRule", () => {
  it("returns just the rule when existing rules is empty", () => {
    expect(addSpecialRule("", "Reliable")).toBe("Reliable");
  });

  it("returns just the rule when existing rules is a dash placeholder", () => {
    expect(addSpecialRule("-", "Reliable")).toBe("Reliable");
  });

  it("returns just the rule when existing rules is an em-dash placeholder", () => {
    expect(addSpecialRule("—", "Reliable")).toBe("Reliable");
  });

  it("appends the new rule to existing rules", () => {
    expect(addSpecialRule("Tearing", "Reliable")).toBe("Tearing, Reliable");
  });

  it("does not add a duplicate rule (case-insensitive)", () => {
    expect(addSpecialRule("Tearing, RELIABLE", "reliable")).toBe("Tearing, RELIABLE");
  });
});

// ============================================================
// removeSpecialRule
// ============================================================

describe("removeSpecialRule", () => {
  it("removes a rule from a list", () => {
    expect(removeSpecialRule("Tearing, Reliable", "Reliable")).toBe("Tearing");
  });

  it("is case-insensitive", () => {
    expect(removeSpecialRule("Tearing, RELIABLE", "reliable")).toBe("Tearing");
  });

  it("returns an em-dash when removing the only rule", () => {
    expect(removeSpecialRule("Reliable", "Reliable")).toBe("—");
  });
});

// ============================================================
// effectiveWeaponWeight
// ============================================================

describe("effectiveWeaponWeight", () => {
  it("returns the base weight unchanged with no upgrades", () => {
    expect(effectiveWeaponWeight("4 kg", [])).toBe("4 kg");
  });

  it("applies a multiplier upgrade (Compact halves weight)", () => {
    expect(effectiveWeaponWeight("4 kg", [upgrade("cr-compact")])).toBe("2 kg");
  });

  it("applies a flat-kg upgrade (Exterminator adds 1 kg)", () => {
    expect(effectiveWeaponWeight("4 kg", [upgrade("cr-exterminator")])).toBe("5 kg");
  });

  it("stacks multiple upgrade modifiers", () => {
    expect(effectiveWeaponWeight("4 kg", [upgrade("cr-compact"), upgrade("cr-exterminator")])).toBe("3 kg");
  });

  it("accepts a plain ASCII 'x' in place of the × sign", () => {
    const asciiX = { ...upgrade("cr-compact"), weightModifier: "x1/2" };
    expect(effectiveWeaponWeight("4 kg", [asciiX])).toBe("2 kg");
  });
});

// ============================================================
// effectiveRangedStats
// ============================================================

describe("effectiveRangedStats", () => {
  const baseWeapon: RangedWeapon = {
    id: "w1",
    name: "Test Lasgun",
    damage: "1d10+3 E",
    range: "100m",
    clip: "60",
    pen: "0",
    specialRules: "Reliable",
    weight: "4 kg",
  };

  it("returns weapon stats unchanged with no upgrades or loaded ammo", () => {
    const result = effectiveRangedStats(baseWeapon, []);
    expect(result.damage).toBe("1d10+3 E");
    expect(result.range).toBe("100m");
    expect(result.clip).toBe("60");
    expect(result.pen).toBe("0");
  });

  it("applies Compact: -1 damage, halves range and clip", () => {
    const result = effectiveRangedStats(baseWeapon, [upgrade("cr-compact")]);
    expect(result.damage).toBe("1d10+2 E");
    expect(result.range).toBe("50m");
    expect(result.clip).toBe("30");
  });

  it("applies Extra Grip: halves range only", () => {
    const result = effectiveRangedStats(baseWeapon, [upgrade("cr-extra-grip")]);
    expect(result.range).toBe("50m");
    expect(result.damage).toBe("1d10+3 E");
  });

  it("applies Overcharge Pack: +1 damage, halves clip", () => {
    const result = effectiveRangedStats(baseWeapon, [upgrade("cr-overcharge-pack")]);
    expect(result.damage).toBe("1d10+4 E");
    expect(result.clip).toBe("30");
  });

  it("applies Dumdum Bullets: +2 damage", () => {
    const result = effectiveRangedStats(baseWeapon, [], ammo("cr-dumdum-bullets"));
    expect(result.damage).toBe("1d10+5 E");
  });

  it("applies Hot-Shot Charge: +1 damage, pen at least 4, clip forced to 1, removes Reliable", () => {
    const result = effectiveRangedStats(baseWeapon, [], ammo("cr-hot-shot-charge"));
    expect(result.damage).toBe("1d10+4 E");
    expect(result.pen).toBe("4");
    expect(result.clip).toBe("1");
    expect(result.specialRules).toBe("—");
  });

  it("Hot-Shot Charge doesn't lower pen if it's already higher than 4", () => {
    const highPenWeapon = { ...baseWeapon, pen: "6" };
    const result = effectiveRangedStats(highPenWeapon, [], ammo("cr-hot-shot-charge"));
    expect(result.pen).toBe("6");
  });

  it("applies Man-Stopper Bullets: +3 pen", () => {
    const result = effectiveRangedStats(baseWeapon, [], ammo("cr-man-stopper-bullets"));
    expect(result.pen).toBe("3");
  });

  it("applies Cryptus Shotgun Shells: adds Sanctified", () => {
    const result = effectiveRangedStats(baseWeapon, [], ammo("dh-cryptus-shotgun-shells"));
    expect(result.specialRules).toBe("Reliable, Sanctified");
  });

  it("applies Psybolt Ammunition: adds Sanctified", () => {
    const result = effectiveRangedStats(baseWeapon, [], ammo("dh-psybolt-ammunition"));
    expect(result.specialRules).toBe("Reliable, Sanctified");
  });

  it("applies Blazer Shotgun Shells: limits range, changes damage to Energy, and adds qualities", () => {
    const result = effectiveRangedStats(baseWeapon, [], ammo("ih-blazer-shotgun-shells"));
    expect(result.range).toBe("15m");
    expect(result.damage).toBe("1d10+3 E");
    expect(result.specialRules).toBe("Reliable, Flame, Primitive");
  });

  it("applies Blessed Ammunition: adds Holy", () => {
    const result = effectiveRangedStats(baseWeapon, [], ammo("ih-blessed-ammunition"));
    expect(result.specialRules).toBe("Reliable, Holy");
  });

  it("applies Purity Round: adds Haywire (2)", () => {
    const result = effectiveRangedStats(baseWeapon, [], ammo("lw-purity-round"));
    expect(result.specialRules).toBe("Reliable, Haywire (2)");
  });

  it("ignores ammo with no special effect", () => {
    const result = effectiveRangedStats(baseWeapon, [], ammo("cr-bullets"));
    expect(result.damage).toBe("1d10+3 E");
    expect(result.specialRules).toBe("Reliable");
  });
});

// ============================================================
// effectiveMeleeStats
// ============================================================

describe("effectiveMeleeStats", () => {
  const baseWeapon: MeleeWeapon = {
    id: "m1",
    name: "Test Sword",
    damage: "1d10+2 R",
    pen: "0",
    specialRules: "Primitive",
    weight: "3 kg",
  };

  it("returns stats unchanged with no upgrades", () => {
    const result = effectiveMeleeStats(baseWeapon, []);
    expect(result.pen).toBe("0");
    expect(result.specialRules).toBe("Primitive");
  });

  it("applies Mono: +2 pen, removes Primitive", () => {
    const result = effectiveMeleeStats(baseWeapon, [upgrade("cr-mono")]);
    expect(result.pen).toBe("2");
    expect(result.specialRules).toBe("—");
  });
});

// ============================================================
// getCompatibleUpgrades
// ============================================================

describe("getCompatibleUpgrades", () => {
  it("includes Compact for a Pistol", () => {
    expect(getCompatibleUpgrades("Pistol", "Laspistol", false, [], "Las").map((u) => u.id)).toContain("cr-compact");
  });

  it("excludes Compact for melee weapons", () => {
    expect(getCompatibleUpgrades("Pistol", "Laspistol", true, [], "Las").map((u) => u.id)).not.toContain("cr-compact");
  });

  it("excludes Compact for Heavy weapons", () => {
    expect(getCompatibleUpgrades("Heavy", "Heavy Bolter", false, [], "Bolt").map((u) => u.id)).not.toContain("cr-compact");
  });

  it("includes Extra Grip only for Basic weapons", () => {
    expect(getCompatibleUpgrades("Basic", "Lasgun", false, [], "Las").map((u) => u.id)).toContain("cr-extra-grip");
    expect(getCompatibleUpgrades("Pistol", "Laspistol", false, [], "Las").map((u) => u.id)).not.toContain("cr-extra-grip");
  });

  it("includes Mono only for melee weapons", () => {
    expect(getCompatibleUpgrades("", "Chainsword", true, []).map((u) => u.id)).toContain("cr-mono");
    expect(getCompatibleUpgrades("Basic", "Lasgun", false, []).map((u) => u.id)).not.toContain("cr-mono");
  });

  it("includes Overcharge Pack only for Las-ammo Pistol/Basic weapons", () => {
    expect(getCompatibleUpgrades("Pistol", "Laspistol", false, [], "Las").map((u) => u.id)).toContain("cr-overcharge-pack");
    expect(getCompatibleUpgrades("Pistol", "Autopistol", false, [], "Solid Projectile").map((u) => u.id)).not.toContain("cr-overcharge-pack");
  });

  it("includes Silencer only for specific weapon names", () => {
    expect(getCompatibleUpgrades("Basic", "Autogun", false, []).map((u) => u.id)).toContain("cr-silencer");
    expect(getCompatibleUpgrades("Pistol", "Laspistol", false, []).map((u) => u.id)).not.toContain("cr-silencer");
  });

  it("excludes Red-Dot Laser Sight and Telescopic Sight when a sight is already fitted", () => {
    const ids = getCompatibleUpgrades("Basic", "Lasgun", false, ["cr-red-dot-laser-sight"]).map((u) => u.id);
    expect(ids).not.toContain("cr-telescopic-sight");
    expect(ids).not.toContain("cr-red-dot-laser-sight");
  });

  it("excludes upgrades that are already fitted", () => {
    expect(getCompatibleUpgrades("Basic", "Lasgun", false, ["cr-extra-grip"]).map((u) => u.id)).not.toContain("cr-extra-grip");
  });

  it("excludes creation-component-only upgrades", () => {
    expect(getCompatibleUpgrades("Basic", "Lasgun", false, []).map((u) => u.id)).not.toContain("lw-integrated-weapon-components");
  });

  it("always includes Exterminator", () => {
    expect(getCompatibleUpgrades("Heavy", "Heavy Bolter", false, []).map((u) => u.id)).toContain("cr-exterminator");
  });
});

// ============================================================
// weaponClassChip
// ============================================================

describe("weaponClassChip", () => {
  it("returns undefined for no class", () => {
    expect(weaponClassChip(undefined)).toBeUndefined();
  });

  it("matches Pistol", () => {
    expect(weaponClassChip("Pistol")?.label).toBe("Pistol");
  });

  it("matches Basic", () => {
    expect(weaponClassChip("Basic")?.label).toBe("Basic");
  });

  it("matches Heavy", () => {
    expect(weaponClassChip("Heavy")?.label).toBe("Heavy");
  });

  it("matches Thrown", () => {
    expect(weaponClassChip("Thrown")?.label).toBe("Thrown");
  });

  it("matches Exotic", () => {
    expect(weaponClassChip("Exotic")?.label).toBe("Exotic");
  });

  it("matches on substring", () => {
    expect(weaponClassChip("Basic Las")?.label).toBe("Basic");
  });

  it("falls back to a generic style for an unrecognised class", () => {
    const chip = weaponClassChip("Melee");
    expect(chip?.label).toBe("Melee");
    expect(chip?.active).toContain("slate");
  });
});

// ============================================================
// ammoFamilyChip
// ============================================================

describe("ammoFamilyChip", () => {
  it("returns undefined for no ammo type", () => {
    expect(ammoFamilyChip(undefined)).toBeUndefined();
  });

  it("matches Las", () => {
    expect(ammoFamilyChip("Las")?.label).toBe("Las");
  });

  it("matches Bolt", () => {
    expect(ammoFamilyChip("Bolt")?.label).toBe("Bolt");
  });

  it("matches Solid Projectile", () => {
    expect(ammoFamilyChip("Solid Projectile")?.label).toBe("Solid Projectile");
  });

  it("matches Shell", () => {
    expect(ammoFamilyChip("Shell")?.label).toBe("Shell");
  });

  it("matches Flame", () => {
    expect(ammoFamilyChip("Flame")?.label).toBe("Flame");
  });

  it("matches Melta", () => {
    expect(ammoFamilyChip("Melta")?.label).toBe("Melta");
  });

  it("matches Plasma", () => {
    expect(ammoFamilyChip("Plasma")?.label).toBe("Plasma");
  });

  it("matches Launcher", () => {
    expect(ammoFamilyChip("Launcher")?.label).toBe("Launcher");
  });

  it("matches Primitive", () => {
    expect(ammoFamilyChip("Primitive")?.label).toBe("Primitive");
  });

  it("matches Shuriken", () => {
    expect(ammoFamilyChip("Shuriken")?.label).toBe("Shuriken");
  });

  it("matches Power Cell", () => {
    expect(ammoFamilyChip("Power Cell")?.label).toBe("Power Cell");
  });

  it("matches Exotic", () => {
    expect(ammoFamilyChip("Exotic")?.label).toBe("Exotic");
  });

  it("falls back to the raw label for an unrecognised ammo type", () => {
    expect(ammoFamilyChip("Xenos Toxin")?.label).toBe("Xenos Toxin");
  });
});

describe("compatibleAmmoIdsWithIH", () => {
  it("adds the IH shotgun ammunition to shell-compatible weapons", () => {
    expect(
      compatibleAmmoIdsWithIH(["cr-shells"], "Shells")
    ).toEqual(
      expect.arrayContaining([
        "cr-shells",
        "ih-blazer-shotgun-shells",
        "ih-void-rounds",
        "ih-blessed-ammunition",
      ])
    );
  });

  it("adds IH bolt ammunition to bolt-compatible weapons", () => {
    expect(
      compatibleAmmoIdsWithIH(["cr-bolt-shells"], "Bolt Shells")
    ).toEqual(
      expect.arrayContaining([
        "cr-bolt-shells",
        "ih-psycannon-bolts",
        "ih-blessed-ammunition",
      ])
    );
  });
});

// ============================================================
// compatibleAmmoIdsForAmmoType
// ============================================================

describe("compatibleAmmoIdsForAmmoType", () => {
  it("returns the compatible ammo ids for a known ammo type", () => {
    expect(compatibleAmmoIdsForAmmoType("Bolt")).toEqual(
      expect.arrayContaining(["cr-bolt-shells", "cr-inferno-shells", "dh-psybolt-ammunition"])
    );
  });

  it("returns undefined for an unknown ammo type", () => {
    expect(compatibleAmmoIdsForAmmoType("Xenos Toxin")).toBeUndefined();
  });

  it("returns undefined for no ammo type", () => {
    expect(compatibleAmmoIdsForAmmoType(undefined)).toBeUndefined();
  });
});

// ============================================================
// rangedCraftsmanshipDescription
// ============================================================

describe("rangedCraftsmanshipDescription", () => {
  it("describes Poor craftsmanship", () => {
    expect(rangedCraftsmanshipDescription("Poor")).toMatch(/Unreliable/);
  });

  it("describes Good craftsmanship", () => {
    expect(rangedCraftsmanshipDescription("Good")).toMatch(/Reliable/);
  });

  it("describes Best craftsmanship", () => {
    expect(rangedCraftsmanshipDescription("Best")).toMatch(/never suffer/);
  });

  it("describes Common craftsmanship", () => {
    expect(rangedCraftsmanshipDescription("Common")).toMatch(/no additional modifier/);
  });
});

// ============================================================
// meleeClassChips
// ============================================================

describe("meleeClassChips", () => {
  it("returns an empty array for no class", () => {
    expect(meleeClassChips(undefined)).toEqual([]);
  });

  it("returns just a Melee chip for a plain melee weapon", () => {
    expect(meleeClassChips("Melee")).toEqual([{ label: "Melee", className: colourOrange }]);
  });

  it("adds a Thrown chip when the class mentions Thrown", () => {
    const chips = meleeClassChips("Melee / Thrown");
    expect(chips).toEqual([
      { label: "Melee", className: colourOrange },
      { label: "Thrown", className: colourAmberFaint },
    ]);
  });

  it("is case-insensitive", () => {
    expect(meleeClassChips("MELEE")).toEqual([{ label: "Melee", className: colourOrange }]);
  });
});

// ============================================================
// meleeCraftsmanshipDescription
// ============================================================

describe("meleeCraftsmanshipDescription", () => {
  it("describes Poor craftsmanship", () => {
    expect(meleeCraftsmanshipDescription("Poor")).toMatch(/-10 penalty/);
  });

  it("describes Good craftsmanship", () => {
    expect(meleeCraftsmanshipDescription("Good")).toMatch(/\+5 bonus/);
  });

  it("describes Best craftsmanship", () => {
    expect(meleeCraftsmanshipDescription("Best")).toMatch(/\+10 bonus/);
  });

  it("describes Common craftsmanship", () => {
    expect(meleeCraftsmanshipDescription("Common")).toMatch(/no additional modifier/);
  });
});
