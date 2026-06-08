// src/data/reference/weaponSpecialRules.ts
// Dark Heresy 1st Edition weapon special rule descriptions.
// Used by the info modal on the Weapons tab.

export const WEAPON_SPECIAL_RULES: Record<string, string> = {
  Accurate:
    "When fired with an Aim action, this weapon grants an additional +10 bonus on top of " +
    "the normal Aim bonus. When using a Full Aim, it grants +20 instead of +10.",

  Balanced: "Balanced weapons grant a +10 bonus to Weapon Skill Tests when used to Parry.",

  Compact:
    "A smaller version of a pistol or basic weapon favoured for concealment over stopping power. " +
    "Halves the weapon's weight, clip size, and range, and reduces its Damage by 1.",

  Blast:
    "On a hit, all targets within the weapon's Blast radius suffer the weapon's damage. " +
    "The number in parentheses is the radius in metres. Targets in the blast make an " +
    "Agility Test (Difficulty set by the GM) to reduce or avoid the damage.",

  Defensive: "A Defensive weapon grants a +15 bonus to Weapon Skill Tests made to Parry.",

  Excruciating:
    "Targets damaged by a weapon with this quality must succeed at either a Difficult (-10) " +
    "Willpower Test or a Difficult (-10) Toughness Test, target's choice, or become Stunned " +
    "for 1 Round.",

  Felling:
    "When this weapon hits, it ignores a number of levels of Unnatural Toughness possessed by " +
    "the target equal to the number in parentheses. For example, Felling (1) ignores Unnatural " +
    "Toughness (x2) or reduces Unnatural Toughness (x3) by one multiplier.",

  Flame:
    "Flame weapons do not roll to hit. Instead, all targets within a 30 degree cone up to the " +
    "weapon's range are automatically hit unless they pass an Agility Test. Targets that " +
    "fail are also set on fire (Toughness Test each round or take 1d10 Energy damage, " +
    "extinguished by a Full Action).",

  Flexible: "Flexible weapons cannot be Parried.",

  Haywire:
    "Uses blasts of electromagnetic radiation to destroy the inner workings of machines and " +
    "technological devices. Everything within the field's radius in metres (the number in " +
    "parentheses) is affected. Roll 1d10: 1-2 Insignificant (no effect); 3-4 Minor Disruption " +
    "(-10 to all actions using technology, including driving, firing non-Primitive ranged weapons, " +
    "Tech-Use, power armour and cybernetics; power armour Move -1); 5-6 Major Disruption (-20 " +
    "penalty, power armour Move -3, technological melee weapons count as Primitive); 7-8 Dead " +
    "Zone (technology ceases to function entirely, power armour Move 1, characters with internal " +
    "cybernetics suffer 1 level of Fatigue per round in the zone); 9-10 Prolonged Dead Zone (as " +
    "Dead Zone but lasts two rounds before lessening). The effect lessens one step each round. " +
    "Additional Haywire hits do not stack; a higher result replaces a lower one.",

  Holy:
    "Against creatures of the Warp (Daemons, Possessed), this weapon counts as having " +
    "the Sanctified quality. Against other targets it has no special effect.",

  Inaccurate: "This weapon gains no benefit from the Aim action.",

  Maximal:
    "The weapon has two fire settings. Before attacking, choose to fire normally (standard profile) " +
    "or on Maximal. Maximal adds 10 to range, +1d10 to damage, and +2 to Penetration; if the weapon " +
    "has the Blast quality, its radius increases by 2. Maximal fire uses three times the normal " +
    "ammunition per shot and adds the Recharge quality.",

  Mono:
    "Mono weapons have specially fashioned blades with superfine edges that cut through " +
    "armour and never lose their edge. The weapon no longer counts as Primitive and gains +2 Penetration.",

  Overheats:
    "Roll a 91-00 when firing and the weapon overheats. The wielder takes Energy damage " +
    "equal to the weapon's Pen (ignoring armour) and the weapon is unusable until cooled " +
    "(one round of inaction).",

  Primitive:
    "The weapon's damage dice cap at 5. When rolling for damage, treat any die result " +
    "above 5 as 5. This does not affect bonuses added to the roll.",

  "Power Field":
    "A field of power wreathes weapons with this quality, increasing Damage and Penetration. " +
    "These modifiers are already included in the weapon's profile. When you successfully Parry " +
    "an attack made with a weapon that lacks this quality, you have a 75% chance of destroying " +
    "the attacker's weapon.",

  Proven:
    "This weapon always inflicts massive trauma. Any die roll for damage lower than the Proven " +
    "rating (the number in parentheses) is treated as if it were that rating instead. For example, " +
    "a Proven (3) weapon treats any die roll of 1 or 2 as a 3 when calculating damage.",

  "Razor Sharp":
    "When the attack roll results in two or more Degrees of Success, double the weapon's " +
    "Penetration value for that attack.",

  Reliable:
    "The weapon only jams on a roll of 00. If it does jam, it can be cleared with a " +
    "Half Action.",

  Recharge:
    "After each shot the weapon requires a Full Action to recharge before it can fire " + "again.",

  Sanctified:
    "Damage from this weapon counts as Holy. Against Daemons and creatures of the Warp, " +
    "its damage ignores the effects of Daemonic (X) and similar warp-based resistances.",

  Scatter:
    "When used at Point Blank range, the weapon gains +10 to hit and increases damage by " +
    "+3. At Long or Extreme range it takes -3 to damage.",

  Shocking:
    "A target that takes at least 1 wound from this weapon must pass a Toughness Test or " +
    "be Stunned for a number of rounds equal to the degrees of failure.",

  Smoke:
    "Rather than inflicting Damage, a hit creates a smokescreen 3d10 metres in diameter from " +
    "the point of impact. The screen lasts 2d10 Rounds, or less in adverse weather conditions.",

  Snare:
    "On a successful hit, the target must make an Agility Test or be immobilised. An immobilised " +
    "target cannot take other actions except to escape, either by bursting the bonds with a " +
    "Strength Test or wriggling free with an Agility Test. The target is helpless until he escapes.",

  Storm:
    "Doubles the number of hits inflicted on the target. In fully automatic mode, each Degree " +
    "of Success yields two additional hits (up to the weapon's firing rate, as normal). " +
    "Storm weapons consume ammunition at twice the normal rate.",

  Tearing: "Roll one additional damage die and discard the lowest result.",

  Toxic:
    "Targets hit must pass a Toughness Test or suffer additional damage from poison " +
    "(see weapon entry for specific effects).",

  "Twin-linked":
    "Gains +20 to hit when fired and uses twice the normal ammunition. On a successful attack " +
    "with two or more Degrees of Success, scores one additional hit. Reload time is doubled.",

  Unbalanced: "This weapon is unwieldy and cannot be used to Parry.",

  Unreliable:
    "The weapon jams on any roll of 91-00. Clearing the jam requires a Full Action " +
    "and a Routine (+20) Tech-Use Test.",

  Unstable:
    "When an Unstable weapon scores a hit, roll 1d10. On 1 it inflicts half Damage, on 2-9 " +
    "it deals normal Damage, and on 10 it inflicts twice normal Damage.",

  Unwieldy:
    "This weapon is too cumbersome to be used to Parry or Dodge when two-handed. " +
    "Striking with it counts as a Full Action.",
};
