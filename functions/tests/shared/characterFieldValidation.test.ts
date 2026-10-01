// functions/tests/shared/characterFieldValidation.test.ts
import { describe, it, expect } from "vitest";
import {
  assertValidCharacterFieldValue,
  assertValidCharacterFieldTransition,
} from "../../src/shared/characterFieldValidation";

describe("assertValidCharacterFieldValue: notes", () => {
  it("rejects a string", () => {
    expect(() => assertValidCharacterFieldValue("notes", "Some campaign notes.")).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });

  it("accepts a well-formed array of note entries", () => {
    expect(() =>
      assertValidCharacterFieldValue("notes", [
        {
          id: "n1",
          title: "Session 1",
          text: "Met the Inquisitor.",
          updatedAt: "2026-09-02T00:00:00.000Z",
        },
      ])
    ).not.toThrow();
  });

  it("accepts an empty array", () => {
    expect(() => assertValidCharacterFieldValue("notes", [])).not.toThrow();
  });

  it("rejects a number", () => {
    expect(() => assertValidCharacterFieldValue("notes", 42)).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });

  it("rejects a plain object (not an array)", () => {
    expect(() => assertValidCharacterFieldValue("notes", { title: "x" })).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });

  it("rejects an array over the entry limit", () => {
    const entries = Array.from({ length: 201 }, (_, index) => ({
      id: `n${index}`,
      title: "T",
      text: "x",
      updatedAt: "2026-09-02T00:00:00.000Z",
    }));
    expect(() => assertValidCharacterFieldValue("notes", entries)).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });

  it("rejects a note entry whose text exceeds the character limit", () => {
    expect(() =>
      assertValidCharacterFieldValue("notes", [
        { id: "n1", title: "T", text: "a".repeat(4001), updatedAt: "2026-09-02T00:00:00.000Z" },
      ])
    ).toThrow(expect.objectContaining({ code: "invalid-argument" }));
  });
});

describe("assertValidCharacterFieldValue: header", () => {
  it("accepts a well-formed header", () => {
    expect(() =>
      assertValidCharacterFieldValue("header", {
        characterName: "Brother Corvus",
        playerName: "Alex",
        career: "Guardsman",
        rank: "Conscript",
        gender: "Male",
        quirks: ["Speaks in a low murmur"],
        age: 34,
      })
    ).not.toThrow();
  });

  it("accepts a header with only characterName", () => {
    expect(() =>
      assertValidCharacterFieldValue("header", { characterName: "Brother Corvus" })
    ).not.toThrow();
  });

  it("rejects a header missing characterName", () => {
    expect(() => assertValidCharacterFieldValue("header", { playerName: "Alex" })).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });

  it("rejects an empty characterName", () => {
    expect(() => assertValidCharacterFieldValue("header", { characterName: "   " })).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });

  it("rejects a characterName over the character limit", () => {
    expect(() =>
      assertValidCharacterFieldValue("header", { characterName: "a".repeat(101) })
    ).toThrow(expect.objectContaining({ code: "invalid-argument" }));
  });

  it("accepts a characterName at exactly the character limit", () => {
    expect(() =>
      assertValidCharacterFieldValue("header", { characterName: "a".repeat(100) })
    ).not.toThrow();
  });

  it("rejects an unknown header key", () => {
    expect(() =>
      assertValidCharacterFieldValue("header", { characterName: "Brother Corvus", notAKey: "x" })
    ).toThrow(expect.objectContaining({ code: "invalid-argument" }));
  });

  it("rejects a non-object value", () => {
    expect(() => assertValidCharacterFieldValue("header", "Brother Corvus")).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });
});

describe("assertValidCharacterFieldValue: portraitUrl", () => {
  const validPortrait = `data:image/jpeg;base64,${"a".repeat(100)}`;

  it("accepts a well-formed encoded JPEG", () => {
    expect(() => assertValidCharacterFieldValue("portraitUrl", validPortrait)).not.toThrow();
  });

  it("accepts a well-formed encoded PNG", () => {
    expect(() =>
      assertValidCharacterFieldValue("portraitUrl", `data:image/png;base64,${"a".repeat(100)}`)
    ).not.toThrow();
  });

  it("accepts a well-formed encoded WebP", () => {
    expect(() =>
      assertValidCharacterFieldValue("portraitUrl", `data:image/webp;base64,${"a".repeat(100)}`)
    ).not.toThrow();
  });

  it("rejects a non-string value", () => {
    expect(() => assertValidCharacterFieldValue("portraitUrl", 12345)).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });

  it("rejects a string with the wrong data URL format", () => {
    expect(() => assertValidCharacterFieldValue("portraitUrl", "not-a-data-url")).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });

  it("rejects an unsupported image type", () => {
    expect(() =>
      assertValidCharacterFieldValue("portraitUrl", `data:image/svg+xml;base64,${"a".repeat(100)}`)
    ).toThrow(expect.objectContaining({ code: "invalid-argument" }));
  });

  it("rejects a portrait over the encoded byte limit", () => {
    const oversized = `data:image/jpeg;base64,${"a".repeat(350_000)}`;
    expect(() => assertValidCharacterFieldValue("portraitUrl", oversized)).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });
});

function makeCharacteristics(overrides: Record<string, unknown> = {}) {
  const base = {
    ws: { base: 30, advances: 2 },
    bs: { base: 30, advances: 0 },
    s: { base: 30, advances: 0 },
    t: { base: 30, advances: 0 },
    ag: { base: 30, advances: 0 },
    int: { base: 30, advances: 0 },
    per: { base: 30, advances: 0 },
    wp: { base: 30, advances: 0 },
    fel: { base: 30, advances: 0 },
  };
  return { ...base, ...overrides };
}

describe("assertValidCharacterFieldValue: characteristics", () => {
  it("accepts a well-formed set of all nine characteristics", () => {
    expect(() =>
      assertValidCharacterFieldValue("characteristics", makeCharacteristics())
    ).not.toThrow();
  });

  it("accepts advancePurchases as an extra allowed field", () => {
    expect(() =>
      assertValidCharacterFieldValue(
        "characteristics",
        makeCharacteristics({
          ws: {
            base: 30,
            advances: 1,
            advancePurchases: { simple: { rankId: "conscript", xpCost: 100 } },
          },
        })
      )
    ).not.toThrow();
  });

  it("rejects a non-object value", () => {
    expect(() => assertValidCharacterFieldValue("characteristics", "not-an-object")).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });

  it("rejects a set missing one of the nine stats", () => {
    const { fel: _fel, ...missingFel } = makeCharacteristics();
    expect(() => assertValidCharacterFieldValue("characteristics", missingFel)).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });

  it("rejects an unexpected top-level stat key", () => {
    expect(() =>
      assertValidCharacterFieldValue(
        "characteristics",
        makeCharacteristics({ notAStat: { base: 30, advances: 0 } })
      )
    ).toThrow(expect.objectContaining({ code: "invalid-argument" }));
  });

  it("rejects a non-finite base", () => {
    expect(() =>
      assertValidCharacterFieldValue(
        "characteristics",
        makeCharacteristics({ ws: { base: NaN, advances: 0 } })
      )
    ).toThrow(expect.objectContaining({ code: "invalid-argument" }));
  });

  it("rejects a non-integer advances", () => {
    expect(() =>
      assertValidCharacterFieldValue(
        "characteristics",
        makeCharacteristics({ ws: { base: 30, advances: 1.5 } })
      )
    ).toThrow(expect.objectContaining({ code: "invalid-argument" }));
  });

  it("rejects an unexpected field on a single stat", () => {
    expect(() =>
      assertValidCharacterFieldValue(
        "characteristics",
        makeCharacteristics({ ws: { base: 30, advances: 0, notAllowed: true } })
      )
    ).toThrow(expect.objectContaining({ code: "invalid-argument" }));
  });
});

describe.each([
  ["talentsAndTraits", { talents: [], traits: [] }],
  ["weaponTraining", { trained: [] }],
  ["psychic", { psyRating: 1 }],
  ["insanity", { points: 5 }],
])("assertValidCharacterFieldValue: %s (object-shaped field)", (field, validValue) => {
  it("accepts a well-formed object", () => {
    expect(() => assertValidCharacterFieldValue(field, validValue)).not.toThrow();
  });

  it("rejects an array", () => {
    expect(() => assertValidCharacterFieldValue(field, [])).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });

  it("rejects a string", () => {
    expect(() => assertValidCharacterFieldValue(field, "not an object")).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });
});

describe.each([
  ["cybernetics", [{ id: "c1", name: "Bionic Arm" }]],
  ["rangedWeapons", [{ id: "r1", name: "Laspistol" }]],
  ["meleeWeapons", [{ id: "m1", name: "Chainsword" }]],
  ["archeotech", [{ id: "a1", name: "Digital Weapon" }]],
])("assertValidCharacterFieldValue: %s (array-shaped field)", (field, validValue) => {
  it("accepts a well-formed array", () => {
    expect(() => assertValidCharacterFieldValue(field, validValue)).not.toThrow();
  });

  it("accepts an empty array", () => {
    expect(() => assertValidCharacterFieldValue(field, [])).not.toThrow();
  });

  it("rejects a plain object", () => {
    expect(() => assertValidCharacterFieldValue(field, { notAnArray: true })).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });

  it("rejects a string", () => {
    expect(() => assertValidCharacterFieldValue(field, "not an array")).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });
});

describe.each([
  ["wounds", { total: 10, current: 8, criticalDamage: 0, fatigue: 0 }],
  ["fate", { total: 3, current: 2 }],
  ["corruption", { points: 5, malignancies: [] }],
  ["movement", { half: 3, full: 6, charge: 9, run: 18 }],
  ["experience", { total: 500, spent: 250, ranks: [] }],
])("assertValidCharacterFieldValue: %s (object-shaped field)", (field, validValue) => {
  it("accepts a well-formed object", () => {
    expect(() => assertValidCharacterFieldValue(field, validValue)).not.toThrow();
  });

  it("rejects an array", () => {
    expect(() => assertValidCharacterFieldValue(field, [])).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });

  it("rejects a string", () => {
    expect(() => assertValidCharacterFieldValue(field, "not an object")).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });
});

describe.each([
  ["gear", [{ id: "g1", name: "Rope" }]],
  ["consumables", [{ id: "c1", name: "Ration Pack" }]],
  ["drugs", [{ id: "d1", name: "Obscura" }]],
  ["grenades", [{ id: "gr1", name: "Frag Grenade" }]],
  ["shields", [{ id: "s1", name: "Riot Shield" }]],
  ["armour", [{ id: "a1", name: "Flak Vest" }]],
  ["companions", [{ id: "co1", name: "Cyber-mastiff" }]],
  ["skills", [{ id: "sk1", level: "trained" }]],
])("assertValidCharacterFieldValue: %s (array-shaped field)", (field, validValue) => {
  it("accepts a well-formed array", () => {
    expect(() => assertValidCharacterFieldValue(field, validValue)).not.toThrow();
  });

  it("accepts an empty array", () => {
    expect(() => assertValidCharacterFieldValue(field, [])).not.toThrow();
  });

  it("rejects a plain object", () => {
    expect(() => assertValidCharacterFieldValue(field, { notAnArray: true })).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });

  it("rejects a string", () => {
    expect(() => assertValidCharacterFieldValue(field, "not an array")).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });
});

describe("assertValidCharacterFieldValue: unknown fields", () => {
  it("rejects a field with no registered validator", () => {
    expect(() => assertValidCharacterFieldValue("notARealCharacterField", { total: 100 })).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });
});

describe("assertValidCharacterFieldTransition: characteristics", () => {
  const adeptCharacter = { header: { career: "Adept" } };
  const zeroWs = { base: 30, advances: 0 };

  it("accepts an advance that pays the real, career-derived cost", () => {
    const oldValue = makeCharacteristics({ ws: zeroWs });
    const newValue = makeCharacteristics({
      ws: { base: 30, advances: 1, advancePurchases: { simple: { cost: 500 } } },
    });

    expect(() =>
      assertValidCharacterFieldTransition("characteristics", oldValue, newValue, adeptCharacter)
    ).not.toThrow();
  });

  it("rejects an advance recorded at a cheaper cost than the career table says", () => {
    const oldValue = makeCharacteristics({ ws: zeroWs });
    const newValue = makeCharacteristics({
      ws: { base: 30, advances: 1, advancePurchases: { simple: { cost: 1 } } },
    });

    expect(() =>
      assertValidCharacterFieldTransition("characteristics", oldValue, newValue, adeptCharacter)
    ).toThrow(expect.objectContaining({ code: "invalid-argument" }));
  });

  it("rejects an advance with no purchase record at all when a real cost exists", () => {
    const oldValue = makeCharacteristics({ ws: zeroWs });
    const newValue = makeCharacteristics({ ws: { base: 30, advances: 1 } });

    expect(() =>
      assertValidCharacterFieldTransition("characteristics", oldValue, newValue, adeptCharacter)
    ).toThrow(expect.objectContaining({ code: "invalid-argument" }));
  });

  it("rejects advancing a characteristic confirmed unbuyable for the career", () => {
    const oldValue = makeCharacteristics({});
    const newValue = makeCharacteristics({
      fel: { base: 30, advances: 1, advancePurchases: { simple: { cost: 1 } } },
    });
    const techPriest = { header: { career: "Tech-Priest" } };

    expect(() =>
      assertValidCharacterFieldTransition("characteristics", oldValue, newValue, techPriest)
    ).toThrow(expect.objectContaining({ code: "invalid-argument" }));
  });

  it("stays permissive when no career is set, matching the client's own existing behaviour", () => {
    const oldValue = makeCharacteristics({ ws: zeroWs });
    const newValue = makeCharacteristics({ ws: { base: 30, advances: 1 } });
    const noCareer = { header: {} };

    expect(() =>
      assertValidCharacterFieldTransition("characteristics", oldValue, newValue, noCareer)
    ).not.toThrow();
  });

  it("does not check a decrease, since it can only refund, never create free XP", () => {
    const oldValue = makeCharacteristics({
      ws: { base: 30, advances: 1, advancePurchases: { simple: { cost: 500 } } },
    });
    const newValue = makeCharacteristics({ ws: zeroWs });

    expect(() =>
      assertValidCharacterFieldTransition("characteristics", oldValue, newValue, adeptCharacter)
    ).not.toThrow();
  });

  it("rejects advancing past the four real tiers", () => {
    const oldValue = makeCharacteristics({ ws: zeroWs });
    const newValue = makeCharacteristics({ ws: { base: 30, advances: 5 } });

    expect(() =>
      assertValidCharacterFieldTransition("characteristics", oldValue, newValue, adeptCharacter)
    ).toThrow(expect.objectContaining({ code: "invalid-argument" }));
  });
});

describe("assertValidCharacterFieldTransition: fields with no registered check", () => {
  it("is a no-op, since most fields don't have a transition validator yet", () => {
    expect(() =>
      assertValidCharacterFieldTransition(
        "gear",
        [],
        [{ id: "g1", name: "Rope" }],
        { header: {} },
        false
      )
    ).not.toThrow();
  });
});

describe("assertValidCharacterFieldTransition: skills", () => {
  const archivist = { header: { career: "Adept", rank: "Archivist" } };
  const blackPriest = {
    header: { career: "Cleric", rank: "Preacher" },
    experience: {
      alternateRanks: [
        {
          alternateRankId: "black-priest-of-maccabeus",
          replacedRankId: "preacher",
          takenAtTier: 4,
        },
      ],
    },
  };

  it("accepts training a skill that's on the career table at the real cost", () => {
    const newValue = [
      { id: "drive-ground", level: "trained", xpPurchases: { trained: { cost: 100 } } },
    ];

    expect(() =>
      assertValidCharacterFieldTransition("skills", [], newValue, archivist, false)
    ).not.toThrow();
  });

  it("rejects training a career-table skill at the wrong cost", () => {
    const newValue = [
      { id: "drive-ground", level: "trained", xpPurchases: { trained: { cost: 1 } } },
    ];

    expect(() =>
      assertValidCharacterFieldTransition("skills", [], newValue, archivist, false)
    ).toThrow(expect.objectContaining({ code: "invalid-argument" }));
  });

  it("rejects advancing a skill that's locked at the character's current rank", () => {
    const oldValue = [
      { id: "drive-ground", level: "trained", xpPurchases: { trained: { cost: 100 } } },
    ];
    const newValue = [
      {
        id: "drive-ground",
        level: "+10",
        xpPurchases: { trained: { cost: 100 }, "+10": { cost: 100 } },
      },
    ];

    expect(() =>
      assertValidCharacterFieldTransition("skills", oldValue, newValue, archivist, false)
    ).toThrow(expect.objectContaining({ code: "invalid-argument" }));
  });

  it("rejects a non-DM training a skill that isn't on the career table at all", () => {
    const newValue = [
      {
        id: "not-a-real-skill",
        level: "trained",
        manualCosts: { trained: 50 },
        xpPurchases: { trained: { cost: 50 } },
      },
    ];

    expect(() =>
      assertValidCharacterFieldTransition("skills", [], newValue, archivist, false)
    ).toThrow(expect.objectContaining({ code: "invalid-argument" }));
  });

  it("allows the DM to train a skill that isn't on the career table, at a DM-set cost", () => {
    const newValue = [
      {
        id: "not-a-real-skill",
        level: "trained",
        manualCosts: { trained: 50 },
        xpPurchases: { trained: { cost: 50 } },
      },
    ];

    expect(() =>
      assertValidCharacterFieldTransition("skills", [], newValue, archivist, true)
    ).not.toThrow();
  });

  it("rejects even the DM setting a skill's level with no cost record at all", () => {
    const newValue = [{ id: "not-a-real-skill", level: "trained" }];

    expect(() =>
      assertValidCharacterFieldTransition("skills", [], newValue, archivist, true)
    ).toThrow(expect.objectContaining({ code: "invalid-argument" }));
  });

  it("does not check a downgrade back to untrained, since removal can only refund", () => {
    const oldValue = [
      { id: "drive-ground", level: "trained", xpPurchases: { trained: { cost: 100 } } },
    ];

    expect(() =>
      assertValidCharacterFieldTransition("skills", oldValue, [], archivist, false)
    ).not.toThrow();
  });

  it("accepts a Skill from the selected Alternate Rank at its printed cost", () => {
    const newValue = [
      {
        id: "forbidden-daemonology",
        level: "trained",
        xpPurchases: { trained: { cost: 100 } },
      },
    ];

    expect(() =>
      assertValidCharacterFieldTransition("skills", [], newValue, blackPriest, false)
    ).not.toThrow();
  });

  it("does not treat the replaced normal Rank table as an ordinary player purchase", () => {
    const newValue = [
      {
        id: "disguise",
        level: "trained",
        xpPurchases: { trained: { cost: 300 } },
      },
    ];

    expect(() =>
      assertValidCharacterFieldTransition("skills", [], newValue, blackPriest, false)
    ).toThrow(expect.objectContaining({ code: "invalid-argument" }));
  });
});

describe("assertValidCharacterFieldTransition: weaponTraining", () => {
  const guardsman = { header: { career: "Guardsman", rank: "Conscript" } };
  const empty = { trained: [], exoticWeapons: [] };
  const trainLas = (cost?: number) => ({
    ...empty,
    trained: ["basic-las"],
    ...(cost === undefined ? {} : { xpPurchases: { "basic-las": { cost } } }),
  });
  const trainBolt = {
    ...empty,
    trained: ["basic-bolt"],
    manualCosts: { "basic-bolt": 350 },
    xpPurchases: { "basic-bolt": { cost: 350 } },
  };
  const needlePistol = { name: "Needle Pistol", cost: 200, xpPurchase: { cost: 200 } };
  const check = (oldValue: unknown, newValue: unknown, isDM: boolean) => () =>
    assertValidCharacterFieldTransition("weaponTraining", oldValue, newValue, guardsman, isDM);

  it("accepts training a group that's on the career table at the real cost", () => {
    expect(check(empty, trainLas(100), false)).not.toThrow();
  });

  it("accepts Weapon Training from a selected Alternate Rank at its printed cost", () => {
    const character = {
      header: { career: "Cleric", rank: "Preacher" },
      experience: {
        alternateRanks: [
          {
            alternateRankId: "black-priest-of-maccabeus",
            replacedRankId: "preacher",
            takenAtTier: 4,
          },
        ],
      },
    };
    const trained = {
      ...empty,
      trained: ["melee-power"],
      xpPurchases: { "melee-power": { cost: 200 } },
    };

    expect(() =>
      assertValidCharacterFieldTransition("weaponTraining", empty, trained, character, false)
    ).not.toThrow();
  });

  it("rejects training a career-table group at the wrong cost", () => {
    expect(check(empty, trainLas(1), false)).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });

  it("rejects training a career-table group with no cost record at all", () => {
    expect(check(empty, trainLas(), false)).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });

  it("rejects a non-DM training a group that isn't unlocked yet", () => {
    expect(check(empty, trainBolt, false)).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });

  it("allows the DM to train a group that isn't unlocked, at a DM-set cost", () => {
    expect(check(empty, trainBolt, true)).not.toThrow();
  });

  it("rejects even the DM adding a locked group with no cost record", () => {
    expect(check(empty, { ...empty, trained: ["basic-bolt"] }, true)).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });

  it("rejects a group that doesn't exist", () => {
    const unknown = {
      ...empty,
      trained: ["not-a-group"],
      xpPurchases: { "not-a-group": { cost: 5 } },
    };
    expect(check(empty, unknown, true)).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });

  it("does not check a removal, since it can only refund", () => {
    expect(check(trainLas(100), empty, false)).not.toThrow();
  });

  it("rejects a non-DM adding an exotic weapon, even with a cost", () => {
    expect(check(empty, { ...empty, exoticWeapons: [needlePistol] }, false)).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });

  it("allows the DM to add an exotic weapon with a name and a cost", () => {
    expect(check(empty, { ...empty, exoticWeapons: [needlePistol] }, true)).not.toThrow();
  });

  it("rejects the DM adding an exotic weapon with no cost", () => {
    expect(check(empty, { ...empty, exoticWeapons: [{ name: "Web Pistol" }] }, true)).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });

  it("accepts a player's patch that leaves existing exotic weapons alone, whatever the key order", () => {
    const stored = {
      ...empty,
      exoticWeapons: [{ xpPurchase: { cost: 200 }, cost: 200, name: "Needle Pistol" }],
    };
    const patched = { ...trainLas(100), exoticWeapons: [needlePistol] };
    expect(check(stored, patched, false)).not.toThrow();
  });
});

describe("assertValidCharacterFieldTransition: experience alternate ranks", () => {
  const clericAtPriest = { header: { career: "Cleric", rank: "Priest" } };
  const clericAtNovice = { header: { career: "Cleric", rank: "Novice" } };
  const clericAtCleric = { header: { career: "Cleric", rank: "Cleric" } };
  const guardsman = { header: { career: "Guardsman", rank: "Sergeant" } };
  const base = { total: 3000, spent: 1000, ranks: [] };
  const blackPriest = {
    alternateRankId: "black-priest-of-maccabeus",
    replacedRankId: "preacher",
    takenAtTier: 4,
  };
  const withSelections = (alternateRanks: unknown[]) => ({ ...base, alternateRanks });
  const check =
    (oldValue: unknown, newValue: unknown, character: Record<string, unknown>, isDM: boolean) =>
    () =>
      assertValidCharacterFieldTransition("experience", oldValue, newValue, character, isDM);

  it("accepts a player taking an alternate rank while ranking up to the rank it replaces", () => {
    expect(check(base, withSelections([blackPriest]), clericAtPriest, false)).not.toThrow();
  });

  it("rejects a player taking an alternate rank that is not open to their career", () => {
    expect(check(base, withSelections([blackPriest]), guardsman, false)).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });

  it("rejects a player taking an alternate rank they are not ranking up to", () => {
    expect(check(base, withSelections([blackPriest]), clericAtNovice, false)).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });

  it("rejects an alternate rank that does not exist", () => {
    const unknown = { ...blackPriest, alternateRankId: "not-a-rank" };
    expect(check(base, withSelections([unknown]), clericAtPriest, false)).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });

  it("rejects a selection whose tier does not match the rank it replaces", () => {
    const wrongTier = { ...blackPriest, takenAtTier: 3 };
    expect(check(base, withSelections([wrongTier]), clericAtPriest, false)).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });

  it("rejects selecting the same alternate rank twice", () => {
    expect(
      check(
        withSelections([blackPriest]),
        withSelections([blackPriest, blackPriest]),
        clericAtPriest,
        false
      )
    ).toThrow(expect.objectContaining({ code: "invalid-argument" }));
  });

  it("rejects a malformed selection", () => {
    const malformed = { alternateRankId: "black-priest-of-maccabeus" };
    expect(check(base, withSelections([malformed]), clericAtPriest, false)).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });

  it("allows the DM to set any alternate rank selection", () => {
    expect(check(base, withSelections([blackPriest]), guardsman, true)).not.toThrow();
  });

  it("accepts a patch that leaves an existing selection alone after the character has moved on", () => {
    const experience = withSelections([blackPriest]);
    expect(check(experience, experience, clericAtCleric, false)).not.toThrow();
  });

  it("does not check a removal", () => {
    expect(
      check(withSelections([blackPriest]), withSelections([]), clericAtPriest, false)
    ).not.toThrow();
  });

  it("does not block an experience patch that changes no alternate ranks", () => {
    expect(check(base, { ...base, spent: 1500 }, guardsman, false)).not.toThrow();
  });
});
