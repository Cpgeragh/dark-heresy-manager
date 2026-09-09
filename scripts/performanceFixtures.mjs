const FIXED_NOW = new Date("2026-01-15T12:00:00.000Z");

export const PERFORMANCE_PROFILE_NAMES = [
  "new-account",
  "empty",
  "small",
  "large-character",
  "large-picker",
  "large-dm",
  "long-thread",
];

function numbered(prefix, index) {
  return `${prefix}-${String(index + 1).padStart(3, "0")}`;
}

function campaignData(uid, name, memberIds = []) {
  return {
    name,
    dmId: uid,
    memberIds,
    createdAt: FIXED_NOW,
    archivedAt: null,
    gmName: "Performance",
    inquisitorName: "Inquisitor Baseline",
  };
}

function emptyCharacter(campaignId, characterName, userId = null) {
  const characteristic = () => ({ base: 30, advances: 0 });
  return {
    campaignId,
    userId,
    recoveryCode: "DH-XXXX-YYYY",
    isEditableByPlayer: true,
    header: {
      characterName,
      playerName: "Performance",
      career: "Adept",
      rank: "Archivist",
      homeWorld: "Hive World",
      divination: "The Emperor knows.",
      description: "Deterministic local performance fixture.",
    },
    characteristics: {
      ws: characteristic(),
      bs: characteristic(),
      s: characteristic(),
      t: characteristic(),
      ag: characteristic(),
      int: characteristic(),
      per: characteristic(),
      wp: characteristic(),
      fel: characteristic(),
    },
    skills: [],
    wounds: { total: 12, current: 12, criticalDamage: 0, fatigue: 0 },
    fate: { total: 2, current: 2 },
    insanity: { points: 0, disorders: [], currentTrauma: [] },
    corruption: { points: 0, malignancies: [] },
    movement: { half: 3, full: 6, charge: 9, run: 18 },
    rangedWeapons: [],
    meleeWeapons: [],
    armour: [],
    talentsAndTraits: { homeworld: "hive-world", homeworldNotes: "", talents: [], traits: [] },
    gear: [],
    companions: [],
    weaponTraining: { trained: [], exoticWeapons: [] },
    experience: { ranks: [], total: 0, spent: 0 },
    psychic: { psyRating: 0, disciplines: [], minorPowers: [], majorPowers: [] },
    notes: "",
    backgroundComplete: true,
  };
}

function characterSummary(campaignId, characterName) {
  return {
    campaignId,
    characterName,
    playerName: "Performance",
    career: "Adept",
    rank: "Novice",
  };
}

function addAccount(writes, uid) {
  writes.push(
    {
      path: `users/${uid}`,
      data: { role: "dm", activeCampaignId: null, createdAt: FIXED_NOW, onboarded: true },
    },
    { path: `userProfiles/${uid}`, data: { firstName: "Performance" } }
  );
}

function addCharacter(writes, campaignId, characterId, character, summaryName) {
  writes.push(
    { path: `campaigns/${campaignId}/characters/${characterId}`, data: character },
    {
      path: `campaigns/${campaignId}/characterSummaries/${characterId}`,
      data: characterSummary(campaignId, summaryName),
    }
  );
}

function addSessions(writes, campaignId, count, attendees = []) {
  for (let index = 0; index < count; index += 1) {
    const id = numbered("session", index);
    const date = new Date(FIXED_NOW.getTime() - index * 86_400_000);
    const summary = {
      date,
      summary: `Session ${index + 1} deterministic summary`,
      xpAwarded: 100,
      attendees,
      createdAt: date,
      xpApplied: true,
    };
    writes.push(
      { path: `campaigns/${campaignId}/sessions/${id}`, data: { ...summary, dmNotes: "DM notes" } },
      { path: `campaigns/${campaignId}/sessionSummaries/${id}`, data: summary }
    );
  }
}

const CUSTOM_CATEGORIES = [
  "gear",
  "consumable",
  "drug",
  "cybernetic",
  "weapon",
  "armour",
  "archeotech",
  "power",
  "trait",
];

function customItemData(category, name) {
  switch (category) {
    case "consumable":
      return { name, description: "Fixture consumable", weight: "0.1", value: "5", source: "CR" };
    case "drug":
      return { name, notes: "Fixture drug", weight: "0.1", value: "10", source: "CR" };
    case "cybernetic":
      return { name, notes: "Fixture implant", craftsmanship: "Common", source: "CR" };
    case "weapon":
      return {
        name,
        weaponKind: "ranged",
        class: "Pistol",
        damage: "1d10+2 E",
        pen: "0",
        range: "30m",
        rof: "S/2/-",
        clip: "12",
        rld: "Full",
        source: "CR",
      };
    case "armour":
      return { name, armourKind: "worn", locations: ["body"], ap: 2, source: "CR" };
    case "archeotech":
      return { name, type: "Gear", description: "Fixture relic", source: "CR" };
    case "power":
      return {
        name,
        discipline: "Telepathy",
        threshold: "10",
        focusTime: "Half Action",
        sustained: "No",
        range: "10m",
        description: "Fixture power",
        source: "CR",
        isMinor: true,
        custom: true,
      };
    case "trait":
      return { name, description: "Fixture trait", source: "CR" };
    default:
      return { name, description: "Fixture gear", weight: "1", value: "10", source: "CR" };
  }
}

function addCustomItems(writes, campaignId, uid, count, characterId, characterName) {
  for (let index = 0; index < count; index += 1) {
    const id = numbered("custom-item", index);
    const versionId = `${id}-v1`;
    const category = CUSTOM_CATEGORIES[index % CUSTOM_CATEGORIES.length];
    const name = `Fixture ${category} ${index + 1}`;
    const creator = {
      userId: uid,
      ...(characterId ? { characterId } : {}),
      ...(characterName ? { characterName } : {}),
    };
    const data = customItemData(category, name);
    const audit = {
      createdAt: FIXED_NOW,
      updatedAt: FIXED_NOW,
      createdBy: creator,
      updatedBy: creator,
    };
    writes.push(
      {
        path: `campaigns/${campaignId}/customItems/${id}`,
        data: {
          id,
          campaignId,
          category,
          status: "published",
          name,
          creator,
          ...audit,
          publishedVersionId: versionId,
          draftVersionId: null,
          latestVersionId: versionId,
          latestVersionNumber: 1,
          archivedAt: null,
          archivedByUserId: null,
          data,
        },
      },
      {
        path: `campaigns/${campaignId}/customItems/${id}/versions/${versionId}`,
        data: {
          id: versionId,
          campaignId,
          customItemId: id,
          category,
          versionNumber: 1,
          status: "published",
          data,
          ...audit,
          publishedAt: FIXED_NOW,
          publishedByUserId: uid,
        },
      }
    );
  }
}

function addThread(writes, campaignId, characterId, uid, count) {
  for (let index = 0; index < count; index += 1) {
    const id = numbered("message", index);
    writes.push({
      path: `campaigns/${campaignId}/threads/${characterId}/messages/${id}`,
      data: {
        fromUid: index % 2 === 0 ? uid : "fixture-player",
        text: `Deterministic message ${index + 1}`,
        timestamp: new Date(FIXED_NOW.getTime() - (count - index) * 60_000),
        read: true,
      },
    });
  }
  writes.push({
    path: `campaigns/${campaignId}/threads/${characterId}`,
    data: {
      characterId,
      lastMessage: `Deterministic message ${count}`,
      lastTimestamp: FIXED_NOW,
      unreadForDM: 0,
    },
  });
}

function largeCharacter(campaignId, uid) {
  const character = emptyCharacter(campaignId, "Large Baseline Acolyte", uid);
  const array = (factory) => Array.from({ length: 180 }, (_, index) => factory(index));

  character.skills = array((index) => ({
    id: numbered("skill", index),
    name: `Skill ${index + 1}`,
    characteristic: "int",
    level: "trained",
    category: "General",
    advanced: false,
    source: "CR",
    notes: "Fixture skill",
  }));
  character.gear = array((index) => ({
    id: numbered("gear", index),
    name: `Gear ${index + 1}`,
    description: "Load-bearing fixture gear",
    weight: "1",
    value: "10",
    source: "CR",
  }));
  character.consumables = array((index) => ({
    id: numbered("consumable", index),
    name: `Consumable ${index + 1}`,
    quantity: 2,
    description: "Fixture consumable",
    source: "CR",
  }));
  character.drugs = array((index) => ({
    id: numbered("drug", index),
    name: `Drug ${index + 1}`,
    quantity: 2,
    notes: "Fixture drug",
    source: "CR",
  }));
  character.grenades = array((index) => ({
    id: numbered("grenade", index),
    name: `Grenade ${index + 1}`,
    quantity: 2,
    damage: "2d10 X",
    pen: "0",
    source: "CR",
  }));
  character.armour = array((index) => ({
    id: numbered("armour", index),
    name: `Armour ${index + 1}`,
    locations: ["body"],
    ap: 2,
    worn: index === 0,
    source: "CR",
  }));
  character.cybernetics = array((index) => ({
    id: numbered("cybernetic", index),
    name: `Cybernetic ${index + 1}`,
    craftsmanship: "Common",
    notes: "Fixture implant",
    source: "CR",
  }));
  character.rangedWeapons = array((index) => ({
    id: numbered("ranged", index),
    name: `Ranged Weapon ${index + 1}`,
    class: "Pistol",
    damage: "1d10+2 E",
    pen: "0",
    range: "30m",
    rof: "S/2/-",
    clip: "12",
    rld: "Full",
    source: "CR",
    equipped: index < 4,
    ...(index === 0
      ? {
          custom: true,
          ammoType: "Bullets",
          ammoEntries: [
            {
              id: "ammo-1",
              referenceId: "cr-bullets",
              name: "Bullets",
              clips: 0,
              rounds: 12,
              loaded: true,
            },
          ],
          loadedAmmoByProfile: Object.fromEntries([
            ...Array.from({ length: 90 }, (_, keyIndex) => [
              `profile-${keyIndex + 1}`,
              `ammo-${keyIndex + 1}`,
            ]),
            ["Primary", "ammo-1"],
          ]),
        }
      : {}),
  }));
  character.meleeWeapons = array((index) => ({
    id: numbered("melee", index),
    name: `Melee Weapon ${index + 1}`,
    class: "Melee",
    damage: "1d10 R",
    pen: "0",
    source: "CR",
    equipped: index < 4,
  }));
  character.talentsAndTraits.talents = array((index) => ({
    uid: numbered("talent-entry", index),
    talentId: numbered("talent", index),
    name: `Talent ${index + 1}`,
    notes: "Fixture talent",
    source: "CR",
  }));
  character.talentsAndTraits.traits = array((index) => ({
    uid: numbered("trait-entry", index),
    talentId: numbered("trait", index),
    name: `Trait ${index + 1}`,
    description: "Fixture trait",
    source: "CR",
  }));
  character.psychic = {
    psyRating: 3,
    disciplines: ["Telepathy"],
    minorPowers: array((index) => ({
      id: numbered("minor-power", index),
      name: `Minor Power ${index + 1}`,
      description: "Fixture psychic power",
      source: "CR",
      isMinor: true,
      known: true,
    })),
    majorPowers: array((index) => ({
      id: numbered("major-power", index),
      name: `Major Power ${index + 1}`,
      discipline: "Telepathy",
      description: "Fixture psychic power",
      source: "CR",
      known: true,
    })),
  };
  character.notes = "N".repeat(3_000);
  return character;
}

function buildSmallProfile(uid) {
  const writes = [];
  addAccount(writes, uid);
  const campaignId = "perf-small";
  writes.push({ path: `campaigns/${campaignId}`, data: campaignData(uid, "Small Baseline") });
  for (let index = 0; index < 4; index += 1) {
    const id = numbered("small-character", index);
    const name = `Small Acolyte ${index + 1}`;
    addCharacter(writes, campaignId, id, emptyCharacter(campaignId, name, uid), name);
  }
  addSessions(writes, campaignId, 8, ["small-character-001"]);
  addCustomItems(writes, campaignId, uid, 12, "small-character-001", "Small Acolyte 1");
  addThread(writes, campaignId, "small-character-001", uid, 30);
  writes.push({
    path: "campaigns/perf-small-player",
    data: { ...campaignData("fixture-other-dm", "Joined Small Campaign", [uid]) },
  });
  return {
    writes,
    route: `/campaign/${campaignId}`,
    campaignId,
    characterId: "small-character-001",
  };
}

export function buildPerformanceProfile(profileName, uid) {
  if (!PERFORMANCE_PROFILE_NAMES.includes(profileName)) {
    throw new Error(`Unknown performance profile: ${profileName}`);
  }
  if (!uid || uid.includes("/")) throw new Error("A valid emulator user id is required.");

  if (profileName === "new-account") return { writes: [], route: "/" };
  if (profileName === "small") return buildSmallProfile(uid);

  const writes = [];
  addAccount(writes, uid);
  if (profileName === "empty") return { writes, route: "/" };

  if (profileName === "large-character") {
    const campaignId = "perf-large-character";
    const characterId = "large-character-001";
    const character = largeCharacter(campaignId, uid);
    writes.push({ path: `campaigns/${campaignId}`, data: campaignData(uid, "Large Character") });
    addCharacter(writes, campaignId, characterId, character, character.header.characterName);
    return {
      writes,
      route: `/campaign/${campaignId}/character/${characterId}`,
      campaignId,
      characterId,
    };
  }

  if (profileName === "large-picker") {
    const campaignId = "perf-large-picker";
    const characterId = "large-picker-character-001";
    const character = largeCharacter(campaignId, uid);
    writes.push({ path: `campaigns/${campaignId}`, data: campaignData(uid, "Large Pickers") });
    addCharacter(writes, campaignId, characterId, character, character.header.characterName);
    addCustomItems(writes, campaignId, uid, 200, characterId, character.header.characterName);
    return {
      writes,
      route: `/campaign/${campaignId}/character/${characterId}`,
      campaignId,
      characterId,
    };
  }

  if (profileName === "large-dm") {
    const campaignId = "perf-large-dm";
    for (let index = 0; index < 45; index += 1) {
      const id = index === 0 ? campaignId : numbered("perf-dm-campaign", index - 1);
      writes.push({ path: `campaigns/${id}`, data: campaignData(uid, `DM Campaign ${index + 1}`) });
    }
    for (let index = 0; index < 90; index += 1) {
      const id = numbered("dm-character", index);
      const name = `DM Acolyte ${index + 1}`;
      addCharacter(writes, campaignId, id, emptyCharacter(campaignId, name), name);
      writes.push({
        path: `campaigns/${campaignId}/threads/${id}`,
        data: {
          characterId: id,
          lastMessage: `Thread preview ${index + 1}`,
          lastTimestamp: new Date(FIXED_NOW.getTime() - index * 60_000),
          unreadForDM: index % 4,
        },
      });
    }
    addSessions(writes, campaignId, 180);
    addCustomItems(writes, campaignId, uid, 180, "dm-character-001", "DM Acolyte 1");
    return { writes, route: `/campaign/${campaignId}`, campaignId };
  }

  const campaignId = "perf-long-thread";
  const characterId = "thread-character-001";
  writes.push({ path: `campaigns/${campaignId}`, data: campaignData(uid, "Long Thread") });
  addCharacter(
    writes,
    campaignId,
    characterId,
    emptyCharacter(campaignId, "Thread Acolyte", uid),
    "Thread Acolyte"
  );
  addThread(writes, campaignId, characterId, uid, 300);
  return {
    writes,
    route: `/campaign/${campaignId}/character/${characterId}`,
    campaignId,
    characterId,
  };
}

export function characterDocumentFromProfile(profile, campaignId, characterId) {
  return profile.writes.find(
    (write) => write.path === `campaigns/${campaignId}/characters/${characterId}`
  )?.data;
}

export function serialisedBytes(value) {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}
