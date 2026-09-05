// tests/functions/patchCharacterField.test.ts
import { describe, it, expect, afterAll } from "vitest";
import { httpsCallable } from "firebase/functions";
import { initializeApp as initializeAdminApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getTestFunctions, signInTestUser, teardownTestFunctions } from "./setup";

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
if (!getApps().length) {
  initializeAdminApp({ projectId: "dh-test" });
}
const adminDb = getFirestore();

describe("Functions: patchCharacterField", () => {
  afterAll(async () => {
    await teardownTestFunctions();
  });

  it("lets the DM patch a character's notes", async () => {
    const dmUid = await signInTestUser();
    const campaignRef = adminDb.collection("campaigns").doc();
    const characterRef = campaignRef.collection("characters").doc();
    await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
    await characterRef.set({
      campaignId: campaignRef.id,
      userId: null,
      isEditableByPlayer: false,
      notes: "",
    });

    const patchCharacterField = httpsCallable(getTestFunctions(), "patchCharacterField");
    await patchCharacterField({
      campaignId: campaignRef.id,
      characterId: characterRef.id,
      field: "notes",
      value: "The DM's own note.",
    });

    const snapshot = await characterRef.get();
    expect(snapshot.data()?.notes).toBe("The DM's own note.");
  }, 15000);

  it("lets the DM patch a character's header", async () => {
    const dmUid = await signInTestUser();
    const campaignRef = adminDb.collection("campaigns").doc();
    const characterRef = campaignRef.collection("characters").doc();
    await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
    await characterRef.set({
      campaignId: campaignRef.id,
      userId: null,
      isEditableByPlayer: false,
      header: { characterName: "Unnamed" },
    });

    const patchCharacterField = httpsCallable(getTestFunctions(), "patchCharacterField");
    await patchCharacterField({
      campaignId: campaignRef.id,
      characterId: characterRef.id,
      field: "header",
      value: { characterName: "Brother Corvus", career: "Guardsman" },
    });

    const snapshot = await characterRef.get();
    expect(snapshot.data()?.header).toEqual({
      characterName: "Brother Corvus",
      career: "Guardsman",
    });

    const summarySnapshot = await campaignRef
      .collection("characterSummaries")
      .doc(characterRef.id)
      .get();
    expect(summarySnapshot.data()).toEqual({
      campaignId: campaignRef.id,
      characterName: "Brother Corvus",
      career: "Guardsman",
    });
  }, 15000);

  it("does not touch the character summary when patching notes", async () => {
    const dmUid = await signInTestUser();
    const campaignRef = adminDb.collection("campaigns").doc();
    const characterRef = campaignRef.collection("characters").doc();
    await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
    await characterRef.set({
      campaignId: campaignRef.id,
      userId: null,
      isEditableByPlayer: false,
      notes: "",
    });

    const patchCharacterField = httpsCallable(getTestFunctions(), "patchCharacterField");
    await patchCharacterField({
      campaignId: campaignRef.id,
      characterId: characterRef.id,
      field: "notes",
      value: "A private note.",
    });

    const summarySnapshot = await campaignRef
      .collection("characterSummaries")
      .doc(characterRef.id)
      .get();
    expect(summarySnapshot.exists).toBe(false);
  }, 15000);

  it("lets the DM patch a character's portrait and updates the summary", async () => {
    const dmUid = await signInTestUser();
    const campaignRef = adminDb.collection("campaigns").doc();
    const characterRef = campaignRef.collection("characters").doc();
    await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
    await characterRef.set({
      campaignId: campaignRef.id,
      userId: null,
      isEditableByPlayer: false,
      header: { characterName: "Brother Corvus" },
    });

    const portrait = `data:image/jpeg;base64,${"a".repeat(100)}`;
    const patchCharacterField = httpsCallable(getTestFunctions(), "patchCharacterField");
    await patchCharacterField({
      campaignId: campaignRef.id,
      characterId: characterRef.id,
      field: "portraitUrl",
      value: portrait,
    });

    const snapshot = await characterRef.get();
    expect(snapshot.data()?.portraitUrl).toBe(portrait);

    const summarySnapshot = await campaignRef
      .collection("characterSummaries")
      .doc(characterRef.id)
      .get();
    expect(summarySnapshot.data()).toEqual({
      campaignId: campaignRef.id,
      characterName: "Brother Corvus",
      portraitUrl: portrait,
    });
  }, 15000);

  it("rejects an oversized portrait", async () => {
    const dmUid = await signInTestUser();
    const campaignRef = adminDb.collection("campaigns").doc();
    const characterRef = campaignRef.collection("characters").doc();
    await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
    await characterRef.set({
      campaignId: campaignRef.id,
      userId: null,
      isEditableByPlayer: false,
      header: { characterName: "Brother Corvus" },
    });

    const oversized = `data:image/jpeg;base64,${"a".repeat(350_000)}`;
    const patchCharacterField = httpsCallable(getTestFunctions(), "patchCharacterField");
    await expect(
      patchCharacterField({
        campaignId: campaignRef.id,
        characterId: characterRef.id,
        field: "portraitUrl",
        value: oversized,
      })
    ).rejects.toMatchObject({ code: "functions/invalid-argument" });
  }, 15000);

  it("lets the DM patch characteristics without touching the summary", async () => {
    const dmUid = await signInTestUser();
    const campaignRef = adminDb.collection("campaigns").doc();
    const characterRef = campaignRef.collection("characters").doc();
    await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
    await characterRef.set({
      campaignId: campaignRef.id,
      userId: null,
      isEditableByPlayer: false,
      header: { characterName: "Brother Corvus" },
    });

    const characteristics = {
      ws: { base: 30, advances: 1 },
      bs: { base: 30, advances: 0 },
      s: { base: 30, advances: 0 },
      t: { base: 30, advances: 0 },
      ag: { base: 30, advances: 0 },
      int: { base: 30, advances: 0 },
      per: { base: 30, advances: 0 },
      wp: { base: 30, advances: 0 },
      fel: { base: 30, advances: 0 },
    };
    const patchCharacterField = httpsCallable(getTestFunctions(), "patchCharacterField");
    await patchCharacterField({
      campaignId: campaignRef.id,
      characterId: characterRef.id,
      field: "characteristics",
      value: characteristics,
    });

    const snapshot = await characterRef.get();
    expect(snapshot.data()?.characteristics).toEqual(characteristics);

    const summarySnapshot = await campaignRef
      .collection("characterSummaries")
      .doc(characterRef.id)
      .get();
    expect(summarySnapshot.exists).toBe(false);
  }, 15000);

  it("rejects a characteristics patch missing a stat", async () => {
    const dmUid = await signInTestUser();
    const campaignRef = adminDb.collection("campaigns").doc();
    const characterRef = campaignRef.collection("characters").doc();
    await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
    await characterRef.set({ campaignId: campaignRef.id, userId: null, isEditableByPlayer: false });

    const incomplete = {
      ws: { base: 30, advances: 0 },
      bs: { base: 30, advances: 0 },
      s: { base: 30, advances: 0 },
      t: { base: 30, advances: 0 },
      ag: { base: 30, advances: 0 },
      int: { base: 30, advances: 0 },
      per: { base: 30, advances: 0 },
      wp: { base: 30, advances: 0 },
    };
    const patchCharacterField = httpsCallable(getTestFunctions(), "patchCharacterField");
    await expect(
      patchCharacterField({
        campaignId: campaignRef.id,
        characterId: characterRef.id,
        field: "characteristics",
        value: incomplete,
      })
    ).rejects.toMatchObject({ code: "functions/invalid-argument" });
  }, 15000);

  it("patches talentsAndTraits and psychic together in one atomic call, mirroring a talent acquisition granting a discipline", async () => {
    const dmUid = await signInTestUser();
    const campaignRef = adminDb.collection("campaigns").doc();
    const characterRef = campaignRef.collection("characters").doc();
    await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
    await characterRef.set({
      campaignId: campaignRef.id,
      userId: null,
      isEditableByPlayer: false,
      talentsAndTraits: { talents: [], traits: [] },
      psychic: { psyRating: 0, disciplines: [] },
    });

    const talentsAndTraits = {
      talents: [{ uid: "t1", talentId: "sanctioned-psyker", name: "Sanctioned Psyker" }],
      traits: [],
    };
    const psychic = { psyRating: 1, disciplines: ["divination"] };

    const patchCharacterField = httpsCallable(getTestFunctions(), "patchCharacterField");
    await patchCharacterField({
      campaignId: campaignRef.id,
      characterId: characterRef.id,
      fields: { talentsAndTraits, psychic },
    });

    const snapshot = await characterRef.get();
    expect(snapshot.data()?.talentsAndTraits).toEqual(talentsAndTraits);
    expect(snapshot.data()?.psychic).toEqual(psychic);
  }, 15000);

  it("rejects a multi-field patch when one field is invalid, applying neither", async () => {
    const dmUid = await signInTestUser();
    const campaignRef = adminDb.collection("campaigns").doc();
    const characterRef = campaignRef.collection("characters").doc();
    await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
    await characterRef.set({
      campaignId: campaignRef.id,
      userId: null,
      isEditableByPlayer: false,
      talentsAndTraits: { talents: [], traits: [] },
      psychic: { psyRating: 0 },
    });

    const patchCharacterField = httpsCallable(getTestFunctions(), "patchCharacterField");
    await expect(
      patchCharacterField({
        campaignId: campaignRef.id,
        characterId: characterRef.id,
        fields: { talentsAndTraits: { talents: [], traits: [] }, psychic: "not-an-object" },
      })
    ).rejects.toMatchObject({ code: "functions/invalid-argument" });

    const snapshot = await characterRef.get();
    expect(snapshot.data()?.talentsAndTraits).toEqual({ talents: [], traits: [] });
  }, 15000);

  it.each([
    ["weaponTraining", { trained: ["basic"] }],
    ["insanity", { points: 5 }],
    ["cybernetics", [{ id: "c1", name: "Bionic Arm" }]],
    ["rangedWeapons", [{ id: "r1", name: "Laspistol" }]],
    ["meleeWeapons", [{ id: "m1", name: "Chainsword" }]],
    ["archeotech", [{ id: "a1", name: "Digital Weapon" }]],
  ])(
    "lets the DM patch %s",
    async (field, value) => {
      const dmUid = await signInTestUser();
      const campaignRef = adminDb.collection("campaigns").doc();
      const characterRef = campaignRef.collection("characters").doc();
      await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
      await characterRef.set({
        campaignId: campaignRef.id,
        userId: null,
        isEditableByPlayer: false,
      });

      const patchCharacterField = httpsCallable(getTestFunctions(), "patchCharacterField");
      await patchCharacterField({
        campaignId: campaignRef.id,
        characterId: characterRef.id,
        field,
        value,
      });

      const snapshot = await characterRef.get();
      expect(snapshot.data()?.[field]).toEqual(value);
    },
    15000
  );

  it.each([
    ["gear", [{ id: "g1", name: "Rope" }]],
    ["consumables", [{ id: "c1", name: "Ration Pack" }]],
    ["drugs", [{ id: "d1", name: "Obscura" }]],
    ["grenades", [{ id: "gr1", name: "Frag Grenade" }]],
    ["shields", [{ id: "s1", name: "Riot Shield" }]],
    ["armour", [{ id: "a1", name: "Flak Vest" }]],
    ["companions", [{ id: "co1", name: "Cyber-mastiff" }]],
    ["skills", [{ id: "sk1", level: "trained" }]],
    ["wounds", { total: 10, current: 8, criticalDamage: 0, fatigue: 0 }],
    ["fate", { total: 3, current: 2 }],
    ["corruption", { points: 5, malignancies: [] }],
    ["movement", { half: 3, full: 6, charge: 9, run: 18 }],
  ])(
    "lets the DM patch %s",
    async (field, value) => {
      const dmUid = await signInTestUser();
      const campaignRef = adminDb.collection("campaigns").doc();
      const characterRef = campaignRef.collection("characters").doc();
      await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
      await characterRef.set({
        campaignId: campaignRef.id,
        userId: null,
        isEditableByPlayer: false,
      });

      const patchCharacterField = httpsCallable(getTestFunctions(), "patchCharacterField");
      await patchCharacterField({
        campaignId: campaignRef.id,
        characterId: characterRef.id,
        field,
        value,
      });

      const snapshot = await characterRef.get();
      expect(snapshot.data()?.[field]).toEqual(value);
    },
    15000
  );

  it("rejects a header patch missing characterName", async () => {
    const dmUid = await signInTestUser();
    const campaignRef = adminDb.collection("campaigns").doc();
    const characterRef = campaignRef.collection("characters").doc();
    await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
    await characterRef.set({
      campaignId: campaignRef.id,
      userId: null,
      isEditableByPlayer: false,
      header: { characterName: "Unnamed" },
    });

    const patchCharacterField = httpsCallable(getTestFunctions(), "patchCharacterField");
    await expect(
      patchCharacterField({
        campaignId: campaignRef.id,
        characterId: characterRef.id,
        field: "header",
        value: { playerName: "Alex" },
      })
    ).rejects.toMatchObject({ code: "functions/invalid-argument" });
  }, 15000);

  it("lets the owning player patch notes when the character is editable", async () => {
    const dmUid = await signInTestUser();
    const campaignRef = adminDb.collection("campaigns").doc();
    const characterRef = campaignRef.collection("characters").doc();
    await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });

    const playerUid = await signInTestUser();
    await characterRef.set({
      campaignId: campaignRef.id,
      userId: playerUid,
      isEditableByPlayer: true,
      notes: "",
    });

    const patchCharacterField = httpsCallable(getTestFunctions(), "patchCharacterField");
    await patchCharacterField({
      campaignId: campaignRef.id,
      characterId: characterRef.id,
      field: "notes",
      value: [
        {
          id: "n1",
          title: "Session 1",
          text: "We met the Inquisitor.",
          updatedAt: "2026-09-02T00:00:00.000Z",
        },
      ],
    });

    const snapshot = await characterRef.get();
    expect(snapshot.data()?.notes).toEqual([
      {
        id: "n1",
        title: "Session 1",
        text: "We met the Inquisitor.",
        updatedAt: "2026-09-02T00:00:00.000Z",
      },
    ]);
  }, 15000);

  it("rejects a player whose character is not editable", async () => {
    const dmUid = await signInTestUser();
    const campaignRef = adminDb.collection("campaigns").doc();
    const characterRef = campaignRef.collection("characters").doc();
    await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });

    const playerUid = await signInTestUser();
    await characterRef.set({
      campaignId: campaignRef.id,
      userId: playerUid,
      isEditableByPlayer: false,
      notes: "",
    });

    const patchCharacterField = httpsCallable(getTestFunctions(), "patchCharacterField");
    await expect(
      patchCharacterField({
        campaignId: campaignRef.id,
        characterId: characterRef.id,
        field: "notes",
        value: "Should be rejected.",
      })
    ).rejects.toMatchObject({ code: "functions/permission-denied" });
  }, 15000);

  it("rejects a field with no registered validator", async () => {
    const dmUid = await signInTestUser();
    const campaignRef = adminDb.collection("campaigns").doc();
    const characterRef = campaignRef.collection("characters").doc();
    await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
    await characterRef.set({ campaignId: campaignRef.id, userId: null, isEditableByPlayer: false });

    const patchCharacterField = httpsCallable(getTestFunctions(), "patchCharacterField");
    await expect(
      patchCharacterField({
        campaignId: campaignRef.id,
        characterId: characterRef.id,
        field: "notARealCharacterField",
        value: { total: 999999, spent: 0 },
      })
    ).rejects.toMatchObject({ code: "functions/invalid-argument" });
  }, 15000);
});
