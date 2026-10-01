import { describe, expect, it } from "vitest";
import { ALTERNATE_RANKS } from "../../src/data/reference/alternateRankData";
import { DEFAULT_SKILLS } from "../../src/data/reference/defaultSkills";
import { ELITE_ADVANCES } from "../../src/data/reference/eliteAdvanceData";
import { TALENT_LIST } from "../../src/data/reference/talentData";
import { TRAIT_LIST } from "../../src/data/reference/traitData";

const skillIds = new Set(DEFAULT_SKILLS.map((skill) => skill.id));
const talentIds = new Set(TALENT_LIST.map((talent) => talent.id));
const traitIds = new Set(TRAIT_LIST.map((trait) => trait.id));

describe("alternateRankData", () => {
  const blackPriest = ALTERNATE_RANKS.find((rank) => rank.id === "black-priest-of-maccabeus");
  const bondedEmissary = ALTERNATE_RANKS.find((rank) => rank.id === "bonded-emissary");
  const xenoArcanist = ALTERNATE_RANKS.find((rank) => rank.id === "calixian-xeno-arcanist");
  const commissariatOperative = ALTERNATE_RANKS.find(
    (rank) => rank.id === "chaliced-commissariat-operative"
  );
  const feralWarrior = ALTERNATE_RANKS.find((rank) => rank.id === "feral-warrior");
  const legateInvestigator = ALTERNATE_RANKS.find((rank) => rank.id === "legate-investigator");
  const malfianBloodsworn = ALTERNATE_RANKS.find((rank) => rank.id === "malfian-bloodsworn");

  it("records the supplied Black Priest entry requirements", () => {
    expect(blackPriest).toMatchObject({
      requiredCareerIds: ["cleric"],
      minimumRank: 4,
      minimumXp: 2_000,
      requirements: {
        maximumCorruption: 9,
        requiredOriginOrTraining: "Maccabeus Quintus",
        excludedOrigins: ["Mind Cleansed"],
      },
    });
  });

  it("records all 30 supplied advances in table order", () => {
    expect(
      blackPriest?.advances.map((advance) =>
        [
          advance.id,
          advance.kind,
          "skillId" in advance
            ? advance.skillId
            : "talentId" in advance
              ? advance.talentId
              : advance.eliteAdvanceId,
          "level" in advance ? advance.level : "",
          "specialisation" in advance ? advance.specialisation : "",
          "cost" in advance ? advance.cost : "",
          "prerequisites" in advance ? (advance.prerequisites ?? "") : "",
        ].join("|")
      )
    ).toEqual([
      "command|skill|command|||100|",
      "common-imperial-creed-20|skill|common-imperial-creed|+20||100|Common Lore (Imperial Creed) +10",
      "deceive-10|skill|deceive|+10||100|Deceive",
      "forbidden-cults|skill|forbidden-cults|||100|",
      "forbidden-daemonology|skill|forbidden-daemonology|||100|",
      "forbidden-daemonology-10|skill|forbidden-daemonology|+10||100|Forbidden Lore (Daemonology)",
      "interrogation|skill|interrogation|||100|",
      "intimidation|skill|intimidate|||100|",
      "pilot-civilian-10|skill|pilot-civilian|+10||100|Pilot (Civilian Craft)",
      "scholastic-legend-10|skill|scholastic-legend|+10||100|Scholastic Lore (Legend)",
      "scholastic-occult|skill|scholastic-occult|||100|",
      "speak-high-gothic|skill|speak-high-gothic|||100|",
      "basic-bolt|talent|basic-weapon-training||Bolt|100|",
      "basic-flame|talent|basic-weapon-training||Flame|100|",
      "hatred-daemons|talent|hatred||Daemons|100|",
      "master-orator|talent|master-orator|||100|Fel 30",
      "melee-chain|talent|melee-weapon-training||Chain|100|",
      "unshakeable-faith|talent|unshakeable-faith|||100|",
      "sound-constitution-100|talent|sound-constitution|||100|",
      "command-10|skill|command|+10||200|Command",
      "forbidden-cults-10|skill|forbidden-cults|+10||200|Forbidden Lore (Cults)",
      "forbidden-warp|skill|forbidden-warp|||200|",
      "melee-power|talent|melee-weapon-training||Power|200|",
      "peer-ordo-malleus|talent|peer||Ordo Malleus|200|Fel 30",
      "pistol-bolt|talent|pistol-training||Bolt|200|",
      "pistol-flame|talent|pistol-training||Flame|200|",
      "sound-constitution-200|talent|sound-constitution|||200|",
      "pure-faith|talent|pure-faith|||300|",
      "purge-the-unclean|talent|purge-the-unclean|||300|Pure Faith",
      "encarta-maleficarum|elite-advance|encarta-maleficarum||||",
    ]);
  });

  it("records the supplied Bonded Emissary entry requirements", () => {
    expect(bondedEmissary).toMatchObject({
      requiredCareerIds: ["adept", "tech-priest"],
      minimumRank: 4,
      minimumXp: 2_000,
      requirements: {
        minimumIntelligence: 30,
        minimumFellowship: 30,
      },
    });
  });

  it("records all 41 supplied Bonded Emissary advances in table order", () => {
    expect(
      bondedEmissary?.advances.map((advance) =>
        [
          advance.id,
          advance.kind,
          "skillId" in advance
            ? advance.skillId
            : "talentId" in advance
              ? advance.talentId
              : advance.eliteAdvanceId,
          "level" in advance ? advance.level : "",
          "specialisation" in advance ? advance.specialisation : "",
          "cost" in advance ? advance.cost : "",
          "prerequisites" in advance ? (advance.prerequisites ?? "") : "",
        ].join("|")
      )
    ).toEqual([
      "barter|skill|barter|||100|",
      "barter-10|skill|barter|+10||100|Barter",
      "charm|skill|charm|||100|",
      "charm-10|skill|charm|+10||100|Charm",
      "common-administratum|skill|common-administratum|||100|",
      "deceive|skill|deceive|||100|",
      "deceive-10|skill|deceive|+10||100|Deceive",
      "disguise|skill|disguise|||100|",
      "dodge|skill|dodge|||100|",
      "evaluate|skill|evaluate|||100|",
      "evaluate-10|skill|evaluate|+10||100|Evaluate",
      "inquiry|skill|inquiry|||100|",
      "inquiry-10|skill|inquiry|+10||100|Inquiry",
      "medicae|skill|medicae|||100|",
      "scholastic-heraldry|skill|scholastic-heraldry|||100|",
      "scholastic-legend|skill|scholastic-legend|||100|",
      "scholastic-mercantile|skill|scholastic-mercantile|||100|",
      "scholastic-philosophy|skill|scholastic-philosophy|||100|",
      "scrutiny|skill|scrutiny|||100|",
      "survival|skill|survival|||100|",
      "sound-constitution|talent|sound-constitution|||100|",
      "talented-barter|talent|talented||Barter|100|Barter",
      "talented-deceive|talent|talented||Deceive|100|Deceive",
      "barter-20|skill|barter|+20||200|Barter +10",
      "carouse|skill|carouse|||200|",
      "carouse-10|skill|carouse|+10||200|Carouse",
      "common-underworld|skill|common-underworld|||200|",
      "deceive-20|skill|deceive|+20||200|Deceive +10",
      "forbidden-inquisition|skill|forbidden-inquisition|||200|",
      "forbidden-mutants|skill|forbidden-mutants|||200|",
      "forbidden-xenos|skill|forbidden-xenos|||200|",
      "inquiry-20|skill|inquiry|+20||200|Inquiry +10",
      "scholastic-mercantile-10|skill|scholastic-mercantile|+10||200|Scholastic Lore (Mercantile)",
      "scrutiny-10|skill|scrutiny|+10||200|Scrutiny",
      "tech-use|skill|tech-use|||200|",
      "decadence|talent|decadence|||200|T 30",
      "quick-draw|talent|quick-draw|||200|",
      "forbidden-archeotech|skill|forbidden-archeotech|||300|",
      "sleight-of-hand|skill|sleight-of-hand|||300|",
      "peer-noble|talent|peer||Noble|300|Fel 30",
      "peer-underworld|talent|peer||Underworld|300|Fel 30",
    ]);
  });

  it("records the supplied Calixian Xeno-Arcanist entry requirements", () => {
    expect(xenoArcanist).toMatchObject({
      requiredCareerIds: ["adept"],
      minimumRank: 4,
      minimumXp: 2_000,
      requirements: {
        minimumIntelligence: 40,
      },
    });
  });

  it("records all 24 supplied Calixian Xeno-Arcanist advances in table order", () => {
    expect(
      xenoArcanist?.advances.map((advance) =>
        [
          advance.id,
          advance.kind,
          "skillId" in advance
            ? advance.skillId
            : "talentId" in advance
              ? advance.talentId
              : advance.eliteAdvanceId,
          "level" in advance ? advance.level : "",
          "specialisation" in advance ? advance.specialisation : "",
          "cost" in advance ? advance.cost : "",
          "prerequisites" in advance ? (advance.prerequisites ?? "") : "",
        ].join("|")
      )
    ).toEqual([
      "awareness-20|skill|awareness|+20||100|Awareness +10",
      "deceive|skill|deceive|||100|",
      "dodge|skill|dodge|||100|",
      "forbidden-mutants|skill|forbidden-mutants|||100|",
      "forbidden-inquisition|skill|forbidden-inquisition|||100|",
      "forbidden-xenos|skill|forbidden-xenos|||100|",
      "inquiry-10|skill|inquiry|+10||100|Inquiry",
      "medicae|skill|medicae|||100|",
      "sound-constitution|talent|sound-constitution|||100|",
      "carouse|skill|carouse|||200|",
      "carouse-10|skill|carouse|+10||200|Carouse",
      "forbidden-xenos-10|skill|forbidden-xenos|+10||200|Forbidden Lore (Xenos)",
      "navigation-stellar-10|skill|navigation-stellar|+10||200|Navigation (Stellar)",
      "scholastic-cryptology|skill|scholastic-cryptology|||200|",
      "tech-use|skill|tech-use|||200|",
      "decadence|talent|decadence|||200|T 30",
      "heightened-senses-sight|talent|heightened-senses||Sight|200|",
      "pistol-training-needle|talent|exotic-weapon-training||Needle Pistol|200|",
      "talented-forbidden-xenos|talent|talented||Forbidden Lore (Xenos)|200|Forbidden Lore (Xenos)",
      "charm|skill|charm|||300|",
      "pilot-spacecraft|skill|pilot-spacecraft|||300|",
      "sleight-of-hand|skill|sleight-of-hand|||300|",
      "peer-ordo-xenos|talent|peer||Ordo Xenos|300|Fel 30",
      "secret-tongue-xenos|skill|secret-tongue-xenos|||400|",
    ]);
    expect(
      xenoArcanist?.advances.find((advance) => advance.id === "secret-tongue-xenos")
    ).toMatchObject({ repeatable: true });
  });

  it("records the supplied Chaliced Commissariat Operative requirements and Trait", () => {
    expect(commissariatOperative).toMatchObject({
      requiredCareerIds: ["guardsman"],
      minimumRank: 3,
      minimumXp: 1_000,
      requirements: {},
      grantedTraits: ["feared-and-loathed"],
    });
  });

  it("records all 16 supplied Chaliced Commissariat Operative advances in table order", () => {
    expect(
      commissariatOperative?.advances.map((advance) =>
        [
          advance.id,
          advance.kind,
          "skillId" in advance
            ? advance.skillId
            : "talentId" in advance
              ? advance.talentId
              : advance.eliteAdvanceId,
          "level" in advance ? advance.level : "",
          "specialisation" in advance ? advance.specialisation : "",
          "cost" in advance ? advance.cost : "",
          "prerequisites" in advance ? (advance.prerequisites ?? "") : "",
        ].join("|")
      )
    ).toEqual([
      "interrogation|skill|interrogation|||100|",
      "intimidate|skill|intimidate|||100|",
      "scrutiny|skill|scrutiny|||100|",
      "search|skill|search|||100|",
      "security|skill|security|||100|",
      "melee-shock|talent|melee-weapon-training||Shock|100|",
      "street-fighting|talent|street-fighting|||100|",
      "common-imperium|skill|common-imperium|||200|",
      "intimidate-10|skill|intimidate|+10||200|Intimidate",
      "interrogation-10|skill|interrogation|+10||200|Interrogation",
      "air-of-authority|talent|air-of-authority|||200|Fel 30",
      "jaded|talent|jaded|||200|",
      "common-underworld|skill|common-underworld|||300|",
      "interrogation-20|skill|interrogation|+20||300|Interrogation +10",
      "intimidate-20|skill|intimidate|+20||300|Intimidate +10",
      "literacy|skill|literacy|||300|",
    ]);
  });

  it("records the supplied Feral Warrior entry requirements", () => {
    expect(feralWarrior).toMatchObject({
      requiredCareerIds: ["guardsman"],
      minimumRank: 3,
      minimumXp: 1_000,
      requirements: {
        requiredOriginOrTraining: "Feral World",
      },
    });
  });

  it("records all 20 supplied Feral Warrior advances in table order", () => {
    expect(
      feralWarrior?.advances.map((advance) =>
        [
          advance.id,
          advance.kind,
          "skillId" in advance
            ? advance.skillId
            : "talentId" in advance
              ? advance.talentId
              : advance.eliteAdvanceId,
          "level" in advance ? advance.level : "",
          "specialisation" in advance ? advance.specialisation : "",
          "cost" in advance ? advance.cost : "",
          "prerequisites" in advance ? (advance.prerequisites ?? "") : "",
        ].join("|")
      )
    ).toEqual([
      "awareness-10|skill|awareness|+10||100|Awareness",
      "concealment|skill|concealment|||100|",
      "dodge-10|skill|dodge|+10||100|Dodge",
      "intimidate|skill|intimidate|||100|",
      "navigation-surface|skill|navigation-surface|||100|",
      "silent-move|skill|silent-move|||100|",
      "survival-10|skill|survival|+10||100|Survival",
      "wrangling|skill|wrangling|||100|",
      "crippling-strike|talent|crippling-strike|||100|WS 50",
      "resistance-fear|talent|resistance||Fear|100|",
      "sound-constitution-1|talent|sound-constitution|||100|",
      "sound-constitution-2|talent|sound-constitution|||100|",
      "gamble|skill|gamble|||200|",
      "survival-20|skill|survival|+20||200|Survival +10",
      "ambidextrous|talent|ambidextrous|||200|Ag 30",
      "die-hard|talent|die-hard|||200|WP 40",
      "frenzy|talent|frenzy|||200|",
      "melee-chain|talent|melee-weapon-training||Chain|200|",
      "swift-attack|talent|swift-attack|||200|WS 35",
      "beast-hunter|talent|beast-hunter|||200|WS 35, BS 35",
    ]);
  });

  it("records the supplied Legate Investigator entry requirements and granted items", () => {
    expect(legateInvestigator).toMatchObject({
      requiredCareerIds: ["adept", "arbitrator", "cleric", "guardsman", "imperial-psyker"],
      minimumRank: 4,
      minimumXp: 2_000,
      requirements: {
        requiredSkills: ["literacy"],
        requiresInquisitorOffer: true,
      },
      grantedGear: [
        expect.objectContaining({
          id: "legature",
          referenceId: "ih-legature",
          name: "Legature",
        }),
        expect.objectContaining({
          id: "sigil-of-question",
          referenceId: "ih-sigil-of-question",
          name: "Sigil of Question",
        }),
      ],
    });
  });

  it("records all 23 supplied Legate Investigator advances in table order", () => {
    expect(
      legateInvestigator?.advances.map((advance) =>
        [
          advance.id,
          advance.kind,
          "skillId" in advance
            ? advance.skillId
            : "talentId" in advance
              ? advance.talentId
              : advance.eliteAdvanceId,
          "level" in advance ? advance.level : "",
          "specialisation" in advance ? advance.specialisation : "",
          "cost" in advance ? advance.cost : "",
          "prerequisites" in advance ? (advance.prerequisites ?? "") : "",
        ].join("|")
      )
    ).toEqual([
      "command|skill|command|||100|",
      "forbidden-cults|skill|forbidden-cults|||100|",
      "forbidden-heresy|skill|forbidden-heresy|||100|",
      "forbidden-mutants|skill|forbidden-mutants|||100|",
      "forbidden-psyker|skill|forbidden-psyker|||100|",
      "inquiry|skill|inquiry|||100|",
      "inquiry-10|skill|inquiry|+10||100|Inquiry",
      "interrogation|skill|interrogation|||100|",
      "interrogation-10|skill|interrogation|+10||100|Interrogate",
      "scrutiny|skill|scrutiny|||100|",
      "scrutiny-10|skill|scrutiny|+10||100|Scrutiny",
      "ciphers-inquisition|skill|ciphers-inquisition|||200|",
      "forbidden-cults-10|skill|forbidden-cults|+10||200|Forbidden Lore (Cults)",
      "forbidden-heresy-10|skill|forbidden-heresy|+10||200|Forbidden Lore (Heresy)",
      "forbidden-mutants-10|skill|forbidden-mutants|+10||200|Forbidden Lore (Mutants)",
      "forbidden-psyker-10|skill|forbidden-psyker|+10||200|Forbidden Lore (Psykers)",
      "inquiry-20|skill|inquiry|+20||200|Inquiry +10",
      "interrogation-20|skill|interrogation|+20||200|Interrogate +10",
      "scholastic-judgement|skill|scholastic-judgement|||200|",
      "scrutiny-20|skill|scrutiny|+20||200|Scrutiny +10",
      "air-of-authority|talent|air-of-authority|||200|Fel 30",
      "talented-inquiry|talent|talented||Inquiry|200|Inquiry",
      "talented-interrogation|talent|talented||Interrogation|200|Interrogation",
    ]);
  });

  it("records the supplied Malfian Bloodsworn requirements and Charter grant", () => {
    expect(malfianBloodsworn).toMatchObject({
      requiredCareerIds: ["assassin", "scum", "guardsman", "arbitrator"],
      minimumRank: 5,
      minimumXp: 3_000,
      requirements: {
        otherRequirements: [
          "Guardsmen or Arbitrators must no longer be in overt Imperial service.",
          "Must gain a charter from the Blood Guild of Malfi.",
        ],
      },
      grantedEliteAdvances: ["bloodsworn-charter"],
    });
  });

  it("records all 39 supplied Malfian Bloodsworn advances in table order", () => {
    expect(
      malfianBloodsworn?.advances.map((advance) =>
        [
          advance.id,
          advance.kind,
          "skillId" in advance
            ? advance.skillId
            : "talentId" in advance
              ? advance.talentId
              : advance.eliteAdvanceId,
          "level" in advance ? advance.level : "",
          "specialisation" in advance ? advance.specialisation : "",
          "cost" in advance ? advance.cost : "",
          "prerequisites" in advance ? (advance.prerequisites ?? "") : "",
        ].join("|")
      )
    ).toEqual([
      "charm|skill|charm|||100|",
      "common-administratum|skill|common-administratum|||100|",
      "deceive|skill|deceive|||100|",
      "inquiry|skill|inquiry|||100|",
      "inquiry-10|skill|inquiry|+10||100|Inquiry",
      "inquiry-20|skill|inquiry|+20||100|Inquiry +10",
      "interrogation|skill|interrogation|||100|",
      "interrogation-10|skill|interrogation|+10||100|Interrogation",
      "search|skill|search|||100|",
      "search-10|skill|search|+10||100|Search",
      "security|skill|security|||100|",
      "security-10|skill|security|+10||100|Security",
      "shadowing|skill|shadowing|||100|",
      "shadowing-10|skill|shadowing|+10||100|Shadowing",
      "survival|skill|survival|||100|",
      "tracking|skill|tracking|||100|",
      "tracking-10|skill|tracking|+10||100|Tracking",
      "basic-bolt|talent|basic-weapon-training||Bolt|100|",
      "decadence|talent|decadence|||100|T 30",
      "hard-target|talent|hard-target|||100|Ag 40",
      "heightened-senses-hearing|talent|heightened-senses||Hearing|100|",
      "heightened-senses-sight|talent|heightened-senses||Sight|100|",
      "iron-jaw|talent|iron-jaw|||100|T 40",
      "jaded|talent|jaded|||100|WP 30",
      "peer-underworld|talent|peer||Underworld|100|Fel 30",
      "pistol-bolt|talent|pistol-training||Bolt|100|",
      "rapid-reaction|talent|rapid-reaction|||100|Ag 40",
      "street-fighting|talent|street-fighting|||100|",
      "barter|skill|barter|||200|",
      "carouse|skill|carouse|||200|",
      "evaluate|skill|evaluate|||200|",
      "forbidden-mutants|skill|forbidden-mutants|||200|",
      "nerves-of-steel|talent|nerves-of-steel|||200|",
      "paranoia|talent|paranoia|||200|",
      "sound-constitution-1|talent|sound-constitution|||200|",
      "sound-constitution-2|talent|sound-constitution|||200|",
      "talented-inquiry|talent|talented||Inquiry|200|Inquiry",
      "two-weapon-wielder-ballistic|talent|two-weapon-wielder||Ballistic|300|BS 35, Ag 35",
      "two-weapon-wielder-melee|talent|two-weapon-wielder||Melee|300|WS 35, Ag 35",
    ]);
  });

  it("only references skills and talents that exist", () => {
    for (const alternateRank of ALTERNATE_RANKS) {
      for (const traitId of alternateRank.grantedTraits ?? []) {
        expect(traitIds.has(traitId), traitId).toBe(true);
      }
      for (const eliteAdvanceId of alternateRank.grantedEliteAdvances ?? []) {
        expect(
          ELITE_ADVANCES.some((eliteAdvance) => eliteAdvance.id === eliteAdvanceId),
          eliteAdvanceId
        ).toBe(true);
      }
      for (const advance of alternateRank.advances) {
        if (advance.kind === "skill") expect(skillIds.has(advance.skillId), advance.id).toBe(true);
        if (advance.kind === "talent") {
          expect(talentIds.has(advance.talentId), advance.id).toBe(true);
        }
        if (advance.kind === "elite-advance") {
          expect(
            ELITE_ADVANCES.some((eliteAdvance) => eliteAdvance.id === advance.eliteAdvanceId),
            advance.eliteAdvanceId
          ).toBe(true);
        }
      }
    }
  });
});
