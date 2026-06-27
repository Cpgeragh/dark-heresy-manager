export const ARMOUR_SPECIAL_RULES: Record<string, string> = {
  Primitive:
    "Only provides full AP against weapons that also have the Primitive quality. " +
    "Against all other attacks, AP is halved (round up).",
  Flak:
    "Counts as AP 5 against any hit from a weapon with the Blast quality, " +
    "provided the wearer was not at the point where the blast originated.",
  Mesh:
    "Formed from thousands of thermoplas cells linked together. " +
    "Becomes momentarily rigid to spread and dissipate impacts and heat energy.",
  Sanctified:
    "Provides full Armour Points against attacks of psychic force or warp energy that deal damage directly, " +
    "and against attacks made with the Warp Weapon quality.",
  Powered:
    "Requires a constant power supply to function. A standard non-military supply lasts 1d5 hours " +
    "before needing replacement or recharging.",
  Overload:
    "A character may only benefit from one force field at a time. When attacked, roll d100; if the result " +
    "is less than or equal to the field's Protection Rating, the attack is nullified. If the roll falls " +
    "within the overload threshold for the field's craftsmanship, the field overloads and ceases to function " +
    "until recharged or repaired with the Luminen Charge Talent or a Very Hard (–30) Tech-Use Test.",
};
