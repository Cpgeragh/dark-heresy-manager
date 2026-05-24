// src/data/traitDescriptions.ts
// Keyed by TraitData.id. Expand entries as needed.

export const TRAIT_DESCRIPTIONS: Record<string, string> = {
  "daemonic":               "Reduces all damage by the creature's Daemonic rating (usually its Willpower bonus). Immune to poison, disease, and mundane environmental effects.",
  "dark-sight":             "The creature ignores all penalties from darkness and poor lighting conditions.",
  "fear":                   "Creatures that encounter this being must pass a Fear test or suffer effects based on the Fear rating (1–4).",
  "from-beyond":            "The creature is utterly alien to human experience. It is immune to Fear, Pinning, Insanity points, and mind-affecting psychic powers.",
  "incorporeal":            "The creature has no physical form and can only be harmed by psychic powers, blessed weapons, or force weapons.",
  "machine":                "The creature is a machine with Armour equal to its Machine rating on all locations. It does not breathe, eat, or feel pain.",
  "multiple-arms":          "The creature has additional limbs and may make one extra attack per round.",
  "natural-armour":         "The creature has tough hide, chitinous plates, or similar protection providing the listed Armour rating to all hit locations.",
  "natural-weapons":        "The creature has claws, teeth, or similar natural weapons that count as Primitive weapons.",
  "regeneration":           "At the start of each round, the creature automatically heals 1 Wound.",
  "size":                   "The creature is abnormally large or small, affecting movement, hit modifiers, and space occupied.",
  "sonar-sense":            "The creature perceives its surroundings via echolocation and is never affected by darkness.",
  "stuff-of-nightmares":    "The creature ignores all Critical Damage effects except those that result in death.",
  "sturdy":                 "The creature is unnaturally difficult to move. It is immune to the Knock-Down and Takedown results.",
  "toxic":                  "Any creature damaged by this being must pass a Toughness test or suffer 1d10 additional damage.",
  "unnatural-characteristic": "One of the creature's characteristics has its bonus doubled for all related tests and calculations.",
  "unnatural-speed":        "The creature moves at double its normal rate.",
  "warp-instability":       "If the creature ends its turn having lost more Wounds than its total, it is destroyed and banished back to the warp.",
  "warp-weapon":            "The creature's attacks bypass non-psychic and non-daemonic armour entirely.",
};
