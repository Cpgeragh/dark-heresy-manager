import { describe, expect, it } from "vitest";
import { TALENT_LIST } from "../../src/data/reference/talentData";
import { TALENT_DESCRIPTIONS } from "../../src/data/reference/talentDescriptions";

const getTalent = (id: string) => {
  const talent = TALENT_LIST.find((entry) => entry.id === id);
  expect(talent, `Missing Talent catalogue entry: ${id}`).toBeDefined();
  return talent!;
};

describe("Talent catalogue prerequisites", () => {
  it.each([
    ["electrical-succour", "Tech-Priest (Electoo inductor/Potentia coil)"],
    ["energy-cache", "Tech-Priest (Potentia coil)"],
    ["feedback-screech", "Tech-Priest (Respirator Unit)"],
    ["ferric-lure", "Tech-Priest (Electoo inductor/Potentia coil)"],
    ["ferric-summons", "Tech-Priest (Electoo inductor/Potentia coil), Ferric Lure"],
    ["gun-blessing", "Tech-Priest (Electoo inductor/Potentia coil)"],
    ["luminen-blast", "Tech-Priest (Electoo inductor/Potentia coil)"],
    ["luminen-charge", "Tech-Priest (Electoo inductor/Potentia coil)"],
    ["luminen-shock", "Tech-Priest (Electoo inductor/Potentia coil)"],
    ["maglev-grace", "Tech-Priest (Potentia coil)"],
    ["maglev-transcendence", "Tech-Priest (Potentia coil), Maglev Grace"],
    ["mechadendrite-use", "Tech-Priest (Cyber Mantle/Cranial Circuitry)"],
    ["mental-fortress", "WP 50, Strong Minded"],
    ["rite-of-awe", "Tech-Priest (Respirator Unit)"],
    ["rite-of-fear", "Tech-Priest (Respirator Unit)"],
    ["rite-of-pure-thought", "Tech-Priest (Cranial Circuitry)"],
  ])("records the full prerequisites for %s", (id, prerequisites) => {
    expect(getTalent(id).prerequisites).toBe(prerequisites);
  });
});

describe("Talent descriptions", () => {
  it("records the correct Chain Weapon Expert self-hit rule", () => {
    const description = TALENT_DESCRIPTIONS["chain-weapon-expert"];

    expect(description).toContain("capable of striking its user");
    expect(description).toContain("unmodified Strength Bonus");
    expect(description).toContain("Impact Damage");
    expect(description).toContain("Armour");
    expect(description).toContain("Toughness Bonus");
    expect(description).not.toContain("minimum Impact damage");
  });

  it.each<[string, string[]]>([
    ["counter-attack", ["weapon that made the Parry", "–20 penalty"]],
    [
      "disarm",
      [
        "engaged with an opponent wielding a melee weapon",
        "win the Opposed Test",
        "Three or more degrees of success",
      ],
    ],
    ["electrical-succour", ["functioning powered machine", "fully charged battery"]],
    ["ferric-lure", ["visible, unsecured metal object", "within 20m"]],
    ["ferric-summons", ["visible, unsecured metal object", "within 40m"]],
    ["frenzy", ["All-Out Attack whenever possible", "may not flee, retreat, or Parry"]],
    ["mimic", ["automatically fails", "clearly see"]],
    [
      "luminen-charge",
      [
        "Ordinary (+10)",
        "chemical battery",
        "Challenging (+0)",
        "lasgun charge pack",
        "Difficult (–10)",
        "overcharge pack",
        "Hard (–20)",
        "land speeder engine",
        "Very Hard (–30)",
        "xenos technology",
        "too arcane, broken, or power-hungry",
      ],
    ],
    ["maglev-grace", ["normal walking speed"]],
    ["marksman", ["Long or Extreme range"]],
    ["psy-rating-4", ["half your Willpower Bonus, rounded up"]],
    ["psy-rating-5", ["half your Willpower Bonus, rounded up"]],
    ["psy-rating-6", ["half your Willpower Bonus, rounded up"]],
    ["resistance", ["resist or avoid"]],
    [
      "rite-of-awe",
      ["regardless of their ability to hear", "cannot speak on another frequency", "within 50m"],
    ],
    [
      "rite-of-fear",
      ["regardless of their ability to hear", "cannot speak on another frequency", "Fear Rating 1"],
    ],
    ["sprint", ["two turns in a row"]],
    [
      "blessed-ignorance",
      [
        "completely forget the recent events",
        "negate any Corruption Points, Insanity Points, or lasting Fear effects",
      ],
    ],
    [
      "burden-of-guilt",
      [
        "hear the faithful's voice",
        "remotely through a device such as a vox",
        "Opposed Willpower Test",
        "+10 to +30",
        "refusing to answer or changing the subject",
        "higher Willpower",
        "Burn:",
      ],
    ],
    [
      "divine-endurance",
      [
        "GM's discretion",
        "course of a journey",
        "suitably holy purpose",
        "For the duration of the encounter",
        "Unnatural Toughness",
      ],
    ],
    [
      "divine-guidance",
      [
        "ignore one penalty",
        "only the largest",
        "confirming Righteous Fury with a second attack roll",
        "ignore the target's Armour",
        "–60",
        "fire blind",
      ],
    ],
    [
      "divine-ministration",
      [
        "After succeeding on a Medicae Test",
        "Willpower Bonus once",
        "remove all Fatigue",
        "Difficult (–10) becoming Challenging (+0)",
        "Challenging (+0) becoming Ordinary (+10)",
        "20 or fewer Corruption Points",
        "restores all Wounds",
      ],
    ],
    [
      "divine-symbol",
      ["more than 20 Corruption Points", "immune to possession", "symbols on himself and allies"],
    ],
    [
      "divine-touch",
      [
        "Called Shot at –20",
        "20 or more Corruption Points",
        "1d5+2",
        "location touched",
        "without inflicting Wounds",
        "directly force a Warp Instability Test at –30",
        "–60",
      ],
    ],
    [
      "flames-of-faith",
      [
        "As a Full Action",
        "twice his Fellowship Bonus in diameter",
        "clip of incendiary ammunition",
        "melta and plasma weapons cannot",
        "+1d10",
        "further +1d10",
        "+2d10",
        "Explosive",
      ],
    ],
    ["grace", ["an ally he can see", "re-roll a failed Test"]],
    [
      "holy-light",
      [
        "10 metres as daylight",
        "next 10 metres as twilight",
        "Melee and Point Blank",
        "Long and Extreme Range",
        "least armoured location",
        "reduced normally by Armour and Toughness Bonus",
        "Easy (+20) Willpower Test each round",
      ],
    ],
    [
      "light-of-the-emperor",
      [
        "faithful and allies up to twice",
        "+20 to Fear Tests",
        "Fear Rating 1",
        "–20 on Interaction Skill Tests",
        "Master Orator",
      ],
    ],
    [
      "martyrs-gift",
      [
        "Full Action",
        "subject remains still",
        "1:1 ratio",
        "Each Critical Effect healed",
        "5 Wounds",
        "Critical Damage through this healing",
        "Energy Damage",
        "not reduced by Armour or Toughness Bonus",
      ],
    ],
    [
      "mental-calm",
      [
        "turn after",
        "previous round",
        "reduces each further gain",
        "by 1",
        "twice his Fellowship Bonus",
      ],
    ],
    [
      "might-of-the-emperor",
      [
        "Strength, Toughness, and Agility",
        "Perception, Intelligence, and Fellowship",
        "Willpower is unaffected",
        "Hard (–20) Intelligence",
        "Challenging (+0) Common Lore",
      ],
    ],
    [
      "miraculous-recovery",
      ["praying over a creature", "1d5 Insanity Points", "both the faithful and the subject"],
    ],
    [
      "no-rest-for-the-faithful",
      [
        "except limb loss and death",
        "permanently lose 1d10 Toughness",
        "lesser Critical Effect",
        "same location and Damage type",
        "1d5 Fatigue",
        "when they take effect",
      ],
    ],
    [
      "pure-faith",
      [
        "Completely immune to Daemonic Presence",
        "spend a Fate Point",
        "before rolling",
        "burn a Fate Point",
        "daemonic psychic attack",
      ],
    ],
    [
      "religious-hysteria",
      [
        "at least 10 minutes",
        "crowd of any size",
        "see and hear the faithful in person",
        "without technology",
        "pays attention for the entire sermon",
        "Opposed Willpower Test",
        "for 24 hours",
        "Challenging (+0) Willpower Test",
        "reasonable enemies",
        "not mind control",
        "Righteous Frenzy",
      ],
    ],
    [
      "repel-daemon",
      [
        "Opposed Willpower Test",
        "does not prevent ranged or psychic attacks",
        "entire game session",
      ],
    ],
    [
      "respite",
      [
        "Full Action each Round",
        "one ally",
        "missing limbs remain missing",
        "bleeding continues",
        "fatal effect still kills",
        "twice the faithful's Fellowship Bonus",
      ],
    ],
    [
      "revelation",
      [
        "Full Action",
        "immediately overcome Fear and Shock",
        "following Turn",
        "Challenging (+0) Willpower Test",
        "ongoing psychic powers",
        "Master Orator",
      ],
    ],
    [
      "seal-of-purity",
      [
        "at least 1 hour",
        "cross the seal or approach within 10 metres",
        "directly disturb it",
        "psychic power across it",
        "greater daemons are unaffected",
        "20 or more Corruption Points",
        "Psy Rating 3 or higher",
      ],
    ],
    [
      "soul-decay",
      [
        "can see and that can hear",
        "Wounds are no more than twice",
        "remainder of the encounter",
        "any Corruption Points",
        "1 unsoakable Damage each Round",
        "until it flees",
      ],
    ],
    [
      "soul-storm",
      [
        "10× his Willpower Bonus",
        "any Corruption Points",
        "1d10 unsoakable Energy Damage",
        "loses access to psychic powers",
        "+1 Damage per Corruption Point",
        "Willpower 50 or higher",
        "cannot use Soul Storm again for 24 hours",
        "Damage is doubled",
      ],
    ],
    [
      "spirit-of-the-martyr",
      [
        "Impact and Rending Damage",
        "Critical Damage by 1",
        "ignores death effects until the end of the encounter",
        "may still lose limbs",
        "burns a Fate Point",
      ],
    ],
    [
      "spiritual-mirror",
      [
        "allies up to his Fellowship Bonus",
        "Shock Table",
        "Challenging (+0) Willpower Test",
        "identical Shock result",
        "immune to Fear",
        "not affected by the result",
      ],
    ],
    [
      "wrath-of-the-righteous",
      [
        "+1d5 to melee Damage",
        "9 or 10",
        "initial Damage roll only",
        "not on later open-ended rolls",
        "Master Orator",
        "+2d10",
      ],
    ],
    [
      "touched-by-the-fates",
      [
        "half its Willpower Bonus",
        "rounded up",
        "spend or burn",
        "off-camera",
        "resolve the scenario in the Acolytes' favour",
        "Righteous Fury",
      ],
    ],
    [
      "sorcerer",
      [
        "effective Psy Rating of 2",
        "three times Willpower Bonus",
        "Major Arcana counting as two slots",
        "without requiring additional Talents",
        "not restricted by the normal Discipline framework",
        "learned or researched independently",
        "normal Psy Rating",
      ],
    ],
    [
      "master-sorcerer",
      [
        "effective Psy Rating of 4",
        "+10 to Daemonic Mastery Tests",
        "immune to Daemonic Presence",
        "normal Psy Rating",
      ],
    ],
    ["sublime-arts", ["without obvious", "outward signs", "Threshold increases by 2"]],
    [
      "psychic-supremacy",
      [
        "half or fewer of your maximum Power Dice",
        "ignore the first 9",
        "counts toward the power's Threshold",
        "later 9 triggers",
        "detect or trace",
        "–10",
      ],
    ],
    [
      "psychic-vampire",
      [
        "intelligent, self-willed, non-Warp creature",
        "Challenging (+0) Willpower Test",
        "1d5–1 Wounds",
        "Daemons, servitors, animals, and machines",
        "Free Action",
        "1d5–2 Corruption Points",
        "Addictive",
      ],
    ],
    [
      "rite-of-banishment",
      [
        "3 Rounds",
        "need not be present",
        "loses the Daemonic Trait",
        "Very Hard (–30) Willpower Test",
      ],
    ],
    [
      "cult-briefing",
      [
        "recall someone's name",
        "political or social elite",
        "augmetic designed to appear questionable",
        "Heretek",
        "Autosanguine",
        "Logis Implant",
        "Orthoproxy",
        "Technical Knock",
        "other than the character's own",
      ],
    ],
    [
      "drill-instruction",
      ["Weapon Training Talent the character possesses", "all those under the character's command"],
    ],
    [
      "blessed-flame",
      ["count as Sanctified", "Astartes Incinerator", "without the normal penalty"],
    ],
    [
      "mechadendrite-use-techsorcist",
      [
        "When using that mechadendrite",
        "+10 to Forbidden Lore (Tech-Heresy)",
        "+10 to Tech-Use Tests",
      ],
    ],
    ["legalese", ["GM's discretion", "outside the Imperium of Mankind", "may be unaffected"]],
    ["commune-with-cogs", ["within its usual capabilities"]],
    ["all-seeing-eye", ["Personally access the Praecursator Grid"]],
    [
      "reformed-skin",
      ["Except in life-threatening situations", "under no obligation to take a replacement"],
    ],
    [
      "purity-of-flesh",
      ["lose any additional benefits", "automatically granted", "take the alternate rank"],
    ],
    [
      "luminen-barrier",
      [
        "incoming Ranged or Melee attack",
        "base Willpower Characteristic",
        "base Willpower Bonus Rounds",
        "before reductions for Armour and Toughness Bonus",
        "Rank 6 (Technomancer or Mech-Deacon)",
        "400 XP",
      ],
    ],
    ["luminen-flare", ["Rank 5 (Tech-Priest)", "300 XP"]],
    [
      "luminen-shield",
      [
        "incoming Ranged or Melee attack",
        "base Willpower Characteristic",
        "base Willpower Bonus Rounds",
        "before reductions for Armour and Toughness Bonus",
        "stops the triggering attack but then collapses",
        "Rank 4 (Enginseer)",
        "200 XP",
      ],
    ],
    ["luminen-surge", ["Rank 4 (Enginseer)", "200 XP"]],
    ["the-flesh-is-weak", ["Ranks 2 and 4 for 100 XP", "Rank 6 for 200 XP", "Rank 8 for 300 XP"]],
  ])("records the corrected rule for %s", (id, requiredFragments) => {
    const description = TALENT_DESCRIPTIONS[id];
    expect(description, `Missing Talent description: ${id}`).toEqual(expect.any(String));
    requiredFragments.forEach((fragment) => expect(description).toContain(fragment));
  });

  it.each([
    "psy-rating-1",
    "psy-rating-2",
    "psy-rating-3",
    "psy-rating-4",
    "psy-rating-5",
    "psy-rating-6",
  ])("states that later Willpower increases do not add powers for %s", (id) => {
    expect(TALENT_DESCRIPTIONS[id]).toContain(
      "Later increases to your Willpower Bonus do not retroactively grant additional powers."
    );
  });

  it("records Miraculous Recovery's dice expression rather than fifteen Insanity Points", () => {
    expect(TALENT_DESCRIPTIONS["miraculous-recovery"]).not.toContain("15 Insanity Points");
  });

  it("keeps Spirit of the Martyr under its stable ID", () => {
    expect(getTalent("spirit-of-the-martyr").name).toBe("Spirit of the Martyr");
    expect(TALENT_DESCRIPTIONS["spirit-of-the-martyr"]).toEqual(expect.any(String));
    expect(TALENT_DESCRIPTIONS["self-of-the-martyr"]).toBeUndefined();
  });
});
