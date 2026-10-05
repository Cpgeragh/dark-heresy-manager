import { describe, expect, it } from "vitest";
import { ALTERNATE_RANKS, ELITE_ADVANCES, TALENT_LIST } from "shared-rules";
import { DEFAULT_SKILLS } from "../../src/data/reference/defaultSkills";
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
  const metallicanGunslinger = ALTERNATE_RANKS.find((rank) => rank.id === "metallican-gunslinger");
  const moritatReaper = ALTERNATE_RANKS.find((rank) => rank.id === "moritat-reaper");
  const reclamator = ALTERNATE_RANKS.find((rank) => rank.id === "reclamator");
  const sisterOblatia = ALTERNATE_RANKS.find((rank) => rank.id === "sister-oblatia");
  const templarCalix = ALTERNATE_RANKS.find((rank) => rank.id === "templar-calix");
  const tyrantineShadowAgent = ALTERNATE_RANKS.find((rank) => rank.id === "tyrantine-shadow-agent");
  const wardenDivisioImmoralis = ALTERNATE_RANKS.find(
    (rank) => rank.id === "warden-divisio-immoralis"
  );
  const mechanicusSecutor = ALTERNATE_RANKS.find((rank) => rank.id === "mechanicus-secutor");

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

  it("records the supplied Metallican Gunslinger requirements and Trait", () => {
    expect(metallicanGunslinger).toMatchObject({
      requiredCareerIds: ["assassin", "scum"],
      minimumRank: 1,
      minimumXp: 0,
      requirements: {
        minimumBallisticSkill: 30,
        requiredOriginOrTraining: "Gunmetal City",
      },
      availableAtCharacterCreation: true,
      grantedTraits: ["knave-of-pistols"],
    });
  });

  it("records all 18 supplied Metallican Gunslinger advances in table order", () => {
    expect(
      metallicanGunslinger?.advances.map((advance) =>
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
      "dodge|skill|dodge|||100|",
      "ambidextrous|talent|ambidextrous|||100|Ag 30",
      "blind-fighting|talent|blind-fighting|||100|Per 30",
      "crack-shot|talent|crack-shot|||100|BS 40",
      "nerves-of-steel|talent|nerves-of-steel|||100|",
      "rapid-reaction|talent|rapid-reaction|||100|Ag 40",
      "rapid-reload|talent|rapid-reload|||100|",
      "two-weapon-wielder-ballistic|talent|two-weapon-wielder||Ballistic|100|BS 35, Ag 35",
      "sleight-of-hand|skill|sleight-of-hand|||200|",
      "deadeye-shot|talent|deadeye-shot|||200|BS 30",
      "independent-targeting|talent|independent-targeting|||200|BS 40",
      "lightning-reflexes|talent|lightning-reflexes|||200|",
      "mighty-shot|talent|mighty-shot|||200|BS 40",
      "pistol-bolt|talent|pistol-training||Bolt|200|",
      "dual-shot|talent|dual-shot|||300|Ag 40, Two-Weapon Wielder (Ballistic)",
      "gunslinger|talent|gunslinger|||300|BS 40, Two-Weapon Wielder (Ballistic)",
      "hip-shooting|talent|hip-shooting|||300|BS 40, Ag 40",
      "jaded|talent|jaded|||300|WP 30",
    ]);
  });

  it("records the supplied Moritat Reaper entry requirements", () => {
    expect(moritatReaper).toMatchObject({
      requiredCareerIds: ["assassin"],
      minimumRank: 6,
      minimumXp: 6_000,
      requirements: {
        otherRequirements: [
          "Moritat Assassin Background Package",
          "Remain true to the Moritat Death Cult’s code",
        ],
      },
    });
  });

  it("records all 32 supplied Moritat Reaper advances in table order", () => {
    expect(
      moritatReaper?.advances.map((advance) =>
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
      "climb-20|skill|climb|+20||100|Climb +10",
      "concealment-10|skill|concealment|+10||100|Concealment",
      "contortionist-10|skill|contortionist|+10||100|Contortionist",
      "deceive|skill|deceive|||100|",
      "intimidate-10|skill|intimidate|+10||100|Intimidate",
      "meditation|talent|meditation|||100|",
      "secret-tongue-moritat-10|skill|secret-tongue-moritat|+10||100|Secret Tongue (Moritat)",
      "silent-move-20|skill|silent-move|+20||100|Silent Move +10",
      "survival-10|skill|survival|+10||100|Survival",
      "ambidextrous|talent|ambidextrous|||100|Ag 30",
      "assassin-strike|talent|assassin-strike|||100|Ag 40, Acrobatics",
      "combat-master|talent|combat-master|||100|WS 30",
      "deceive-10|skill|deceive|+10||200|Deceive",
      "forbidden-cults|skill|forbidden-cults|||200|",
      "scholastic-legend|skill|scholastic-legend|||200|",
      "scholastic-occult|skill|scholastic-occult|||200|",
      "secret-tongue-moritat-20|skill|secret-tongue-moritat|+20||200|Secret Tongue (Moritat) +10",
      "counter-attack|talent|counter-attack|||200|WS 40",
      "dual-strike|talent|dual-strike|||200|Ag 40, Two-Weapon Wielder (Melee)",
      "frenzy|talent|frenzy|||200|",
      "hatred-heretics|talent|hatred||Heretics|200|",
      "hatred-mutants|talent|hatred||Mutants|200|",
      "hatred-psykers|talent|hatred||Psykers|200|",
      "insanely-faithful|talent|insanely-faithful|||200|",
      "nerves-of-steel|talent|nerves-of-steel|||200|",
      "sound-constitution-1|talent|sound-constitution|||200|",
      "sound-constitution-2|talent|sound-constitution|||200|",
      "sound-constitution-3|talent|sound-constitution|||200|",
      "step-aside|talent|step-aside|||200|Ag 40, Dodge",
      "wall-of-steel|talent|wall-of-steel|||200|Ag 35",
      "peer-inquisition|talent|peer||Inquisition|300|Fel 30",
      "the-reaping|talent|the-reaping|||300|WS 40, Combat Master",
    ]);
  });

  it("records the supplied Reclamator entry requirements", () => {
    expect(reclamator).toMatchObject({
      requiredCareerIds: ["scum"],
      minimumRank: 1,
      minimumXp: 0,
      requirements: {
        minimumIntelligence: 30,
        requiredOriginOrTraining: "Hive World, Forge World, or Void Born",
      },
      availableAtCharacterCreation: true,
    });
  });

  it("records all 23 supplied Reclamator advances in table order", () => {
    expect(
      reclamator?.advances.map((advance) =>
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
      "barter|skill|barter|||100|",
      "charm|skill|charm|||100|",
      "dodge|skill|dodge|||100|",
      "dodge-10|skill|dodge|+10||100|Dodge",
      "drive-ground|skill|drive-ground|||100|",
      "evaluate|skill|evaluate|||100|",
      "search|skill|search|||100|",
      "trade-technomat|skill|trade-technomat|||100|",
      "trade-technomat-10|skill|trade-technomat|+10||100|Trade (Technomat)",
      "pistol-las|talent|pistol-training||Las|100|",
      "pistol-primitive|talent|pistol-training||Primitive|100|",
      "unremarkable|talent|unremarkable|||100|",
      "sound-constitution-1|talent|sound-constitution|||100|",
      "sound-constitution-2|talent|sound-constitution|||100|",
      "barter-10|skill|barter|+10||200|Barter",
      "chem-use|skill|chem-use|||200|",
      "common-tech|skill|common-tech|||200|",
      "tech-use|skill|tech-use|||200|",
      "quick-draw|talent|quick-draw|||200|",
      "common-machine-cult|skill|common-machine-cult|||300|",
      "scholastic-chymistry|skill|scholastic-chymistry|||300|",
      "tech-use-10|skill|tech-use|+10||300|Tech Use",
    ]);
  });

  it("records the supplied Sister Oblatia entry requirements", () => {
    expect(sisterOblatia).toMatchObject({
      requiredCareerIds: ["adepta-sororitas"],
      minimumRank: 5,
      minimumXp: 3_000,
      requirements: {},
    });
  });

  it("records the Templar Calix requirements, force-weapon choice and martial prowess costs", () => {
    expect(templarCalix).toMatchObject({
      requiredCareerIds: ["imperial-psyker"],
      requiredCareerPaths: ["Savant Militant"],
      minimumRank: 4,
      minimumXp: 2_000,
      requirements: { maximumInsanity: 10, maximumCorruption: 10 },
      grantedMeleeWeaponChoice: {
        id: "force-weapon",
        referenceIds: ["ih-force-axe", "ih-force-staff", "ih-force-sword"],
      },
      characteristicAdvanceOverrides: {
        ws: { simple: 100, intermediate: 250, trained: 500, expert: 750 },
        int: { simple: 500, intermediate: 750, trained: 1_000, expert: 2_500 },
      },
    });
  });

  it("records the Mechanicus Secutor and Templar Calix rank titles for ranks 4 to 8", () => {
    const secutor = ALTERNATE_RANKS.find((rank) => rank.id === "mechanicus-secutor");
    expect(secutor?.rankTitles).toEqual([
      { tier: 4, names: ["Secutor"] },
      { tier: 5, names: ["Myrmidon"] },
      { tier: 6, names: ["Centurius"] },
      { tier: 7, names: ["Tribune", "Magnus"] },
      { tier: 8, names: ["Magos Militant"] },
    ]);
    expect(templarCalix?.rankTitles).toEqual([
      { tier: 4, names: ["Templar Tertius"] },
      { tier: 5, names: ["Templar Secundus"] },
      { tier: 6, names: ["Templar Primus"] },
      { tier: 7, names: ["Templar Ordinator"] },
      { tier: 8, names: ["Master Templar Calix"] },
    ]);
  });

  it("records the Tyrantine Shadow Agent requirements", () => {
    expect(tyrantineShadowAgent).toMatchObject({
      requiredCareerIds: [
        "adept",
        "arbitrator",
        "assassin",
        "cleric",
        "guardsman",
        "imperial-psyker",
        "scum",
      ],
      minimumRank: 5,
      minimumXp: 3_000,
      requirements: {},
    });
    expect(tyrantineShadowAgent?.requiredCareerIds).not.toContain("adepta-sororitas");
    expect(tyrantineShadowAgent?.requiredCareerIds).not.toContain("tech-priest");
  });

  it("records all 27 supplied Tyrantine Shadow Agent advances in table order", () => {
    expect(
      tyrantineShadowAgent?.advances.map(
        (advance) => `${advance.id}:${"cost" in advance ? advance.cost : 0}`
      )
    ).toEqual([
      "ciphers-tenebrae-collegium:100",
      "ciphers-tenebrae-collegium-10:100",
      "ciphers-tenebrae-collegium-20:100",
      "deceive:100",
      "deceive-10:100",
      "disguise:100",
      "disguise-10:100",
      "inquiry:100",
      "scholastic-legend:100",
      "secret-tongue-tenebrae-collegium:100",
      "secret-tongue-tenebrae-collegium-10:100",
      "secret-tongue-tenebrae-collegium-20:100",
      "labyrinth-conditioning:100",
      "mimic:100",
      "resistance-psychic-powers:100",
      "unremarkable:100",
      "deceive-20:200",
      "disguise-20:200",
      "forbidden-cults:200",
      "forbidden-cults-10:200",
      "forbidden-inquisition:200",
      "forbidden-inquisition-10:200",
      "inquiry-10:200",
      "inquiry-20:200",
      "scholastic-legend-10:200",
      "strong-minded:200",
      "mental-fortress:300",
    ]);
  });

  it("records the Warden of the Divisio Immoralis character-creation requirements", () => {
    expect(wardenDivisioImmoralis).toMatchObject({
      requiredCareerIds: ["arbitrator"],
      minimumRank: 1,
      minimumXp: 0,
      availableAtCharacterCreation: true,
      insanityGain: "1d5",
    });
  });

  it("records all 19 supplied Warden advances in table order", () => {
    expect(
      wardenDivisioImmoralis?.advances.map(
        (advance) => `${advance.id}:${"cost" in advance ? advance.cost : 0}`
      )
    ).toEqual([
      "awareness:100",
      "common-arbites-10:100",
      "drive-ground:100",
      "drive-hover:100",
      "forbidden-cults:100",
      "inquiry-10:100",
      "scrutiny:100",
      "armour-of-contempt:100",
      "basic-sp:100",
      "decadence:100",
      "melee-primitive:100",
      "peer-the-insane:100",
      "pistol-sp:100",
      "sound-constitution:100",
      "resistance-fear:100",
      "forbidden-cults-10:200",
      "forbidden-heresy:200",
      "scholastic-occult:200",
      "flagellant:200",
    ]);
  });

  it("records all 50 supplied Templar Calix advances", () => {
    expect(templarCalix?.advances).toHaveLength(50);
    expect(
      templarCalix?.advances.map(
        (advance) => `${advance.id}:${"cost" in advance ? advance.cost : 0}`
      )
    ).toEqual([
      "acrobatics:100",
      "acrobatics-10:100",
      "dodge-10:100",
      "meditation:100",
      "psyniscience-10:100",
      "secret-tongue-temple-calix:100",
      "secret-tongue-temple-calix-10:100",
      "secret-tongue-temple-calix-20:100",
      "ambidextrous:100",
      "armour-of-contempt:100",
      "blademaster:100",
      "blind-fighting:100",
      "catfall:100",
      "corpus-conversion:100",
      "deflect-shot:100",
      "disarm:100",
      "crippling-strike:100",
      "crushing-blow:100",
      "hard-target:100",
      "melee-chain:100",
      "melee-power:100",
      "minor-psychic-power-1:100",
      "minor-psychic-power-2:100",
      "precise-blow:100",
      "resistance-fear:100",
      "sound-constitution-100:100",
      "street-fighting:100",
      "sure-strike:100",
      "two-weapon-wielder-melee:100",
      "acrobatics-20:200",
      "dodge-20:200",
      "combat-master:200",
      "counter-attack:200",
      "discipline-focus:200",
      "dual-strike:200",
      "jaded:200",
      "lightning-reflexes:200",
      "sound-constitution-200:200",
      "swift-attack:200",
      "psy-rating-3:200",
      "psychic-power-1:200",
      "psychic-power-2:200",
      "forbidden-psyker-10:300",
      "assassin-strike:300",
      "lightning-attack:300",
      "peer-noble:300",
      "psy-rating-4:300",
      "sound-constitution-300:300",
      "step-aside:300",
      "wall-of-steel:300",
    ]);
  });

  it("records all 28 supplied Sister Oblatia advances in table order", () => {
    expect(
      sisterOblatia?.advances.map((advance) =>
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
      "concealment|skill|concealment|||100|",
      "inquiry|skill|inquiry|||100|",
      "interrogation|skill|interrogation|||100|",
      "intimidate|skill|intimidate|||100|",
      "silent-move|skill|silent-move|||100|",
      "ambidextrous|talent|ambidextrous|||100|",
      "blind-fighting|talent|blind-fighting|||100|Per 30",
      "melee-chain|talent|melee-weapon-training||Chain|100|",
      "melee-power|talent|melee-weapon-training||Power|100|",
      "melee-shock|talent|melee-weapon-training||Shock|100|",
      "sound-constitution-1|talent|sound-constitution|||100|",
      "sound-constitution-2|talent|sound-constitution|||100|",
      "two-weapon-wielder-melee|talent|two-weapon-wielder||Melee|100|WS 35, Ag 35",
      "two-weapon-wielder-ballistic|talent|two-weapon-wielder||Ballistic|100|BS 35, Ag 35",
      "dodge-20|skill|dodge|+20||200|Dodge +10",
      "scholastic-occult|skill|scholastic-occult|||200|",
      "tracking|skill|tracking|||200|",
      "crushing-blow|talent|crushing-blow|||200|S 40",
      "die-hard|talent|die-hard|||200|WP 40",
      "frenzy|talent|frenzy|||200|",
      "furious-assault|talent|furious-assault|||200|WS 35",
      "lightning-reflexes|talent|lightning-reflexes|||200|Ag 30",
      "rapid-reload|talent|rapid-reload|||200|",
      "swift-attack|talent|swift-attack|||200|WS 35",
      "forbidden-heresy|skill|forbidden-heresy|||300|",
      "forbidden-cults|skill|forbidden-cults|||300|",
      "duty-unto-death|talent|duty-unto-death|||300|WP 45",
      "fearless|talent|fearless|||300|",
    ]);
  });

  it("records the supplied Mechanicus Secutor entry requirements", () => {
    expect(mechanicusSecutor).toMatchObject({
      requiredCareerIds: ["tech-priest"],
      minimumRank: 4,
      minimumXp: 2_000,
      requirements: {
        otherRequirements: ["WS 35", "BS 35", "WP 35", "Any four Weapon Training talents"],
      },
    });
    expect(mechanicusSecutor?.description).toBeUndefined();
  });

  it("records all 59 supplied Mechanicus Secutor advances in table order", () => {
    expect(
      mechanicusSecutor?.advances.map((advance) =>
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
      "common-machine-cult-20|skill|common-machine-cult|+20||100|Common Lore (Machine Cult) +10",
      "common-war|skill|common-war|||100|",
      "common-war-10|skill|common-war|+10||100|Common Lore (War)",
      "ciphers-myrmidon|skill|ciphers-myrmidon|||100|",
      "ciphers-myrmidon-10|skill|ciphers-myrmidon|+10||100|Ciphers (Myrmidon)",
      "demolition-10|skill|demolition|+10||100|Demolition",
      "drive-hover-10|skill|drive-hover|+10||100|Drive (Hover Vehicle)",
      "drive-walker-20|skill|drive-walker|+20||100|Drive (Walker) +10",
      "intimidate|skill|intimidate|||100|",
      "navigation-surface|skill|navigation-surface|||100|",
      "pilot-military|skill|pilot-military|||100|",
      "ambidextrous|talent|ambidextrous|||100|Ag 30",
      "basic-bolt|talent|basic-weapon-training||Bolt|100|",
      "basic-flame|talent|basic-weapon-training||Flame|100|",
      "basic-melta|talent|basic-weapon-training||Melta|100|",
      "concealed-cavity|talent|concealed-cavity|||100|",
      "crippling-strike|talent|crippling-strike|||100|WS 50",
      "ferric-lure|talent|ferric-lure|||100|",
      "heavy-sp|talent|heavy-weapon-training||SP|100|",
      "mechadendrite-manipulator|talent|mechadendrite-use||Manipulator|100|Tech-Priest",
      "mechadendrite-optical|talent|mechadendrite-use||Optical|100|Tech-Priest",
      "melee-chain|talent|melee-weapon-training||Chain|100|",
      "pistol-flame|talent|pistol-training||Flame|100|",
      "pistol-plasma|talent|pistol-training||Plasma|100|",
      "resistance-cold|talent|resistance||Cold|100|",
      "resistance-heat|talent|resistance||Heat|100|",
      "resistance-poisons|talent|resistance||Poisons|100|",
      "sound-constitution-100-1|talent|sound-constitution|||100|",
      "sound-constitution-100-2|talent|sound-constitution|||100|",
      "total-recall|talent|total-recall|||100|Int 30",
      "awareness|skill|awareness|||200|",
      "ciphers-myrmidon-20|skill|ciphers-myrmidon|+20||200|Ciphers (Myrmidon) +10",
      "command-10|skill|command|+10||200|Command",
      "common-guard|skill|common-guard|||200|",
      "secret-tongue-acolyte-10|skill|secret-tongue-acolyte|+10||200|Secret Tongue (Acolyte)",
      "bulging-biceps|talent|bulging-biceps|||200|S 45",
      "exotic-breacher|talent|exotic-weapon-training||Breacher|200|",
      "exotic-shock-blaster|talent|exotic-weapon-training||Shock Blaster|200|",
      "hatred-tech-heretics|talent|hatred||Tech Heretics|200|",
      "hatred-xeno|talent|hatred||Xeno|200|",
      "heavy-las|talent|heavy-weapon-training||Las|200|",
      "heavy-launcher|talent|heavy-weapon-training||Launcher|200|",
      "mechadendrite-gun|talent|mechadendrite-use||Gun|200|Tech-Priest",
      "melee-power|talent|melee-weapon-training||Power|200|",
      "resistance-fear|talent|resistance||Fear|200|",
      "resistance-psychic-powers|talent|resistance||Psychic Powers|200|",
      "sound-constitution-200-1|talent|sound-constitution|||200|",
      "sound-constitution-200-2|talent|sound-constitution|||200|",
      "two-weapon-wielder-ballistic|talent|two-weapon-wielder||Ballistic|200|BS 35, Ag 35",
      "two-weapon-wielder-melee|talent|two-weapon-wielder||Melee|200|WS 35, Ag 35",
      "forbidden-archeotech|skill|forbidden-archeotech|||300|",
      "forbidden-xenos|skill|forbidden-xenos|||300|",
      "forbidden-warp|skill|forbidden-warp|||300|",
      "die-hard|talent|die-hard|||300|WP 40",
      "exotic-graviton-gun|talent|exotic-weapon-training||Graviton Gun|300|",
      "exotic-needle-pistol|talent|exotic-weapon-training||Needle Pistol|300|",
      "exotic-rad-cleanser|talent|exotic-weapon-training||Rad-Cleanser|300|",
      "machinator-array|talent|machinator-array|||500|Tech-Priest, Mechadendrite Use (Gun)",
    ]);
  });

  it("offers Tech Heretics as a Hatred choice for the Secutor's Hatred entry", () => {
    const behaviour = TALENT_LIST.find((talent) => talent.id === "hatred")?.behaviour;
    expect(
      behaviour?.kind === "hybrid" &&
        behaviour.options.some((option) => "value" in option && option.value === "Tech Heretics")
    ).toBe(true);
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
