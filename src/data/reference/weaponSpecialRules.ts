// src/data/reference/weaponSpecialRules.ts
// Dark Heresy 1st Edition weapon special rule descriptions.
// Used by the info modal on the Weapons tab.

export const WEAPON_SPECIAL_RULES: Record<string, string> = {

  // ── Core rules ─────────────────────────────────────────────────────────────
  "Accurate":
    "When fired with an Aim action, this weapon grants an additional +10 bonus on top of " +
    "the normal Aim bonus. When using a Full Aim, it grants +20 instead of +10.",

  "Balanced":
    "Balanced weapons grant a +10 bonus to Weapon Skill Tests when used to Parry.",

  "Blast":
    "On a hit, all targets within the weapon's Blast radius suffer the weapon's damage. " +
    "The number in parentheses is the radius in metres. Targets in the blast make an " +
    "Agility Test (Difficulty set by the GM) to reduce or avoid the damage.",

  "Concussive":
    "Targets that take damage from this weapon must make a Toughness Test or be Stunned " +
    "for a number of rounds equal to the degrees of failure.",

  "Defensive":
    "A Defensive weapon grants a +15 bonus to Weapon Skill Tests made to Parry.",

  "Flame":
    "Flame weapons do not roll to hit. Instead, all targets within a 30° cone up to the " +
    "weapon's range are automatically hit unless they pass an Agility Test. Targets that " +
    "fail are also set on fire (Toughness Test each round or take 1d10 Energy damage, " +
    "extinguished by a Full Action).",

  "Flexible":
    "Flexible weapons cannot be Parried.",

  "Holy":
    "Against creatures of the Warp (Daemons, Possessed), this weapon counts as having " +
    "the Sanctified quality. Against other targets it has no special effect.",

  "Inaccurate":
    "This weapon gains no benefit from the Aim action.",

  "Overheats":
    "Roll a 91–00 when firing and the weapon overheats. The wielder takes Energy damage " +
    "equal to the weapon's Pen (ignoring armour) and the weapon is unusable until cooled " +
    "(one round of inaction).",

  "Primitive":
    "The weapon's damage dice cap at 5. When rolling for damage, treat any die result " +
    "above 5 as 5. This does not affect bonuses added to the roll.",

  "Reliable":
    "The weapon only jams on a roll of 00. If it does jam, it can be cleared with a " +
    "Half Action.",

  "Recharge":
    "After each shot the weapon requires a Full Action to recharge before it can fire " +
    "again.",

  "Sanctified":
    "Damage from this weapon counts as Holy. Against Daemons and creatures of the Warp, " +
    "its damage ignores the effects of Daemonic (X) and similar warp-based resistances.",

  "Scatter":
    "When used at Point Blank range, the weapon gains +10 to hit and increases damage by " +
    "+3. At Long or Extreme range it takes –3 to damage.",

  "Shocking":
    "A target that takes at least 1 wound from this weapon must pass a Toughness Test or " +
    "be Stunned for a number of rounds equal to the degrees of failure.",

  "Special":
    "The weapon has a unique rule described in its entry — consult the source book for " +
    "full details.",

  "Storm":
    "When fired on Semi-Auto or Full-Auto, this weapon doubles the number of hits " +
    "scored. Full-Auto fire produces twice the normal maximum hits.",

  "Tearing":
    "Roll one additional damage die and discard the lowest result.",

  "Toxic":
    "Targets hit must pass a Toughness Test or suffer additional damage from poison " +
    "(see weapon entry for specific effects).",

  "Twin-linked":
    "When fired, roll to hit twice and use the better result. If both hit, the target " +
    "takes damage from each hit separately.",

  "Unbalanced":
    "This weapon is unwieldy and cannot be used to Parry.",

  "Unreliable":
    "The weapon jams on any roll of 91–00. Clearing the jam requires a Full Action " +
    "and a Routine (+20) Tech-Use Test.",

  "Unwieldy":
    "This weapon is too cumbersome to be used to Parry or Dodge when two-handed. " +
    "Striking with it counts as a Full Action.",

};
