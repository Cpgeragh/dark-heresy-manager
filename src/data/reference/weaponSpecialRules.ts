// src/data/reference/weaponSpecialRules.ts
// Dark Heresy 1st Edition weapon special rule descriptions.
// Used by the info modal on the Weapons tab.

export const WEAPON_SPECIAL_RULES: Record<string, string> = {
  Accurate:
    "Some weapons are designed with precision in mind and respond superbly in skilled hands. " +
    "They grant an additional bonus of +10 to the firer’s Ballistic Skill when used with an Aim " +
    "Action, this is in addition to the bonus granted from Aiming. When firing a single shot from " +
    "a single Basic Weapon with the Accurate quality benefiting from the Aim action, the attack gains " +
    "an extra 1d10 of damage for every two degrees of success to a maximum of two extra 1d10.",

  Balanced:
    "Some weapons, such as swords and knives, are designed so that the weight of the hilt " +
    "balances the weight of the blade, making the weapon easier to wield. Balanced weapons grant " +
    "a +10 bonus to Weapon Skill Tests made to Parry.",

  Compact:
    "A smaller version of a pistol or basic weapon favoured for concealment over stopping power. " +
    "Halves the weapon's weight, clip size, and range, and reduces its Damage by 1.",

  Blast:
    "Many missiles, grenades and some guns create an explosion when they hit their target. When " +
    "working out a hit from a Blast weapon anyone within the weapon’s blast radius in metres, " +
    "indicated by the number in parenthesis, is also hit. Roll Hit Location and Damage individually " +
    "for each person affected by a blast.",

  Defensive:
    "A Defensive weapon, such as a shield, is intended to be used to block attacks and is awkward " +
    "when used for making attacks. Defensive weapons grant a +15 bonus to tests made when used " +
    "to Parry, but take a –10 penalty when used to make attacks.",

  Excruciating:
    "Targets damaged by a weapon with this quality must succeed at either a Difficult (-10) " +
    "Willpower Test or a Difficult (-10) Toughness Test, target's choice, or become Stunned " +
    "for 1 Round.",

  Felling:
    "When this weapon hits, it ignores a number of levels of Unnatural Toughness possessed by " +
    "the target equal to the number in parentheses. For example, Felling (1) ignores Unnatural " +
    "Toughness (x2) or reduces Unnatural Toughness (x3) by one multiplier.",

  Flame:
    "Flame weapons project a cone of flame out to the range of the weapon. Unlike other weapons, " +
    "flamers have just one range, and when fired, cast fiery death out to this distance. The wielder " +
    "does not need to Test Ballistic Skill; he simply fires the weapon. All creatures in the flame’s " +
    "path, a cone-shaped area extending in a 30 degree arc from the firer out to the weapon’s range, " +
    "must make an Agility Test or be struck by the flames and take damage normally. If they take " +
    "damage, they must succeed on a second Agility Test or be set on fire. Cover does not protect " +
    "characters from attacks made by Flame weapons. Because Flame weapons make no roll to hit, " +
    "they are always considered to hit targets in the body, and will Jam if the firer rolls a 9 on " +
    "his Damage dice (before adding any bonuses). Normally when a weapon is fired without the " +
    "appropriate talent or a heavy weapon is fired without bracing, the wielder suffers a –20 or –30 " +
    "BS penalty respectively. As Flame weapons do not use BS, instead of a –20/–30 to the attack " +
    "roll, anyone in the area of effect of the flames gains a +20/+30 bonus to their Agility Test " +
    "to avoid damage.",

  Flexible:
    "Some weapons are made up from lots of loosely connected segments, such as chains or supple " +
    "woven hides, such as whips. These kinds of weapons lash about when used to attack and cannot " +
    "be Parried.",

  Fast:
    "The size and speed of this weapon makes it hard to Parry. Opponents that would Parry an attack " +
    "against a weapon with the Fast quality take a –20 penalty on their Weapon Skill Tests.",

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

  Inaccurate:
    "Weapons with this quality are either badly designed or simply woefully made, and regardless " +
    "of the care taken when used, offer little better than a lucky chance to hit. No bonus is gained " +
    "from the use of the Aim Action with such weapons.",

  Maximal:
    "The weapon has two fire settings. Before attacking, choose to fire normally (standard profile) " +
    "or on Maximal. Maximal adds 10 to range, +1d10 to damage, and +2 to Penetration; if the weapon " +
    "has the Blast quality, its radius increases by 2. Maximal fire uses three times the normal " +
    "ammunition per shot and adds the Recharge quality.",

  Mono:
    "Mono weapons have specially fashioned blades with superfine edges that cut through " +
    "armour and never lose their edge. The weapon no longer counts as Primitive and gains +2 Penetration.",

  Overheats:
    "Certain weapons are prone to overheating, either because of poor design or they fire unstable " +
    "superheated ammunition. An unmodified to hit roll of 91 or higher causes the weapon to " +
    "Overheat. Roll 1d10: 1–5, the firer must make a Toughness Test or drop the weapon, which " +
    "cannot be fired for 1d10 Rounds; 6–8, the firer takes 1d10+2 Energy Damage and must drop " +
    "the weapon, which is too hot to pick up (anyone trying takes 1d10+1 Energy Damage) for 1d10 " +
    "Rounds; 9–10, the weapon explodes and is destroyed, and the firer and anyone within four " +
    "metres takes Damage as if they had taken a single hit from the weapon.",

  Primitive:
    "Crude and basic in design, these kinds of weapons, while still deadly, are less effective " +
    "against modern armour. Non-primitive armour gets its APs doubled before being reduced for " +
    "penetration. For example, Guard Flak Armour (AP 4) hit with a Great Weapon (Primitive quality " +
    "and Pen 2) would provide 6 points of armour: (4x2)-2.",

  "Power Field":
    "A field of power wreathes weapons with this quality, increasing Damage and Penetration. " +
    "Such modifiers are already included in the weapon’s profile. When you successfully use this " +
    "weapon to Parry an attack made with a weapon that lacks this quality, you have a 75% chance " +
    "of destroying your attacker’s weapon.",

  Proven:
    "This weapon always inflicts massive trauma. Any die roll for damage lower than the Proven " +
    "rating (the number in parentheses) is treated as if it were that rating instead. For example, " +
    "a Proven (3) weapon treats any die roll of 1 or 2 as a 3 when calculating damage.",

  "Razor Sharp":
    "When the attack roll results in two or more Degrees of Success, double the weapon's " +
    "Penetration value for that attack.",

  Reliable:
    "Based on tried and true technology, Reliable weapons seldom fail. If a Reliable weapon Jams, " +
    "roll 1d10 and only on a roll of 10 has it in fact Jammed, otherwise it just misses as normal.",

  Recharge:
    "Because of the volatile nature of the weapon’s ammunition or due to the way it fires, the weapon " +
    "needs time between shots to Recharge. The weapon must spend the Round after firing building up " +
    "a charge and cannot be fired—in effect you can only fire the weapon every other Round.",

  Sanctified:
    "Damage from this weapon counts as Holy. Against Daemons and creatures of the Warp, " +
    "its damage ignores the effects of Daemonic (X) and similar warp-based resistances.",

  Scatter:
    "The standard ammunition of these weapons spreads out when fired, hitting more of the target. " +
    "If fired at a foe within Point Blank range, each two degrees of success the firer scores " +
    "indicates another hit. However, at longer ranges this spread of small projectiles reduces its " +
    "effectiveness. All Armour Points are doubled against hits from scatter weapons at Long or " +
    "Extreme Range. Pistols with the Scatter quality fired in melee are considered to be firing at " +
    "Point-Blank range. However, they do not gain the +30 BS bonus for being at Point-Blank range. " +
    "When firing a semi- or full-auto burst at point blank range with a weapon that has the Scatter " +
    "quality, the extra hits for rate of fire and scatter are worked out separately and both applied.",

  Shocking:
    "Shocking weapons can Stun their opponents with a powerful surge of energy. A target that takes " +
    "at least 1 point of Damage from a Shocking weapon, after Armour and Toughness Bonus, must make " +
    "a Toughness Test, though they receive a +10 bonus for every Armour point they have on the " +
    "location hit. If they fail, they are Stunned for a number of Rounds equal to half the Damage " +
    "they suffered.",

  Smoke:
    "Rather than inflicting Damage, these weapons throw up dense clouds of smoke to create cover. " +
    "When a hit is scored from a weapon with the Smoke quality, it creates a smokescreen 3d10 " +
    "metres in diameter from the point of impact. This screen lasts for 2d10 Rounds, or less in " +
    "adverse weather conditions.",

  Snare:
    "Weapons with this quality are designed to entangle enemies. On a successful hit, the target " +
    "must make an Agility Test or be immobilised. An immobilised target can attempt no other actions " +
    "except to try to escape the bonds. He can attempt to burst the bonds (a Strength Test) or " +
    "wriggle free (an Agility Test) in his Turn. The target is considered helpless until he escapes.",

  Storm:
    "Doubles the number of hits inflicted on the target. In fully automatic mode, each Degree " +
    "of Success yields two additional hits (up to the weapon's firing rate, as normal). " +
    "Storm weapons consume ammunition at twice the normal rate.",

  Tearing:
    "Tearing weapons are vicious devices, often using multitudes of fast-moving jagged teeth or " +
    "fragmented or explosive ammunition to rip into flesh and bone. These weapons roll one extra die " +
    "for damage, and the lowest result is discarded.",

  Toxic:
    "Some weapons rely on toxins and poisons to do their damage. Anyone that takes Damage from a " +
    "Toxic weapon, after reduction for Armour and Toughness Bonus must make a Toughness Test with " +
    "a –5 penalty for every point of Damage taken. Success indicates there is no further effect from " +
    "the weapon. Failure however deals an immediate 1d10 points of Impact Damage to the target with " +
    "no reduction from Armour or Toughness Bonus.",

  "Twin-linked":
    "Gains +20 to hit when fired and uses twice the normal ammunition. On a successful attack " +
    "with two or more Degrees of Success, scores one additional hit. Reload time is doubled.",

  "Two-Handed":
    "This weapon requires two hands to use.",

  Unbalanced:
    "Heavy and difficult to ready after an attack, these kinds of weapons impose a –10% penalty " +
    "when used to Parry.",

  Unreliable:
    "Certain weapons misfire more often than normal because they are badly maintained or constructed. " +
    "An Unreliable weapon suffers a Jam on a roll of 91 or higher, even if fired on Semi- or Full Auto.",

  Unstable:
    "Weapons with this quality use ammunition that is both volatile and unstable and can react " +
    "unpredictably when detonated. When an Unstable weapon scores a hit, roll 1d10. On a score of " +
    "1 it inflicts only half Damage, on a score of 2–9 it deals normal Damage, and on a score of " +
    "10 it inflicts twice the normal Damage.",

  Unwieldy:
    "Huge and often top-heavy, Unwieldy weapons are too awkward to be used defensively. Unwieldy " +
    "weapons cannot be used to Parry.",
};
