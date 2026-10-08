import { afterAll, describe, expect, it } from "vitest";
import { httpsCallable } from "firebase/functions";
import { getApps, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getTestFunctions, signInTestUser, teardownTestFunctions } from "./setup";

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
if (!getApps().length) initializeAdminApp({ projectId: "dh-test" });
const adminDb = getFirestore();

interface MutationResult {
  customItemId?: string;
  versionId?: string;
}

describe("Functions: custom-item mutations", () => {
  afterAll(async () => {
    await teardownTestFunctions();
  });

  it("creates the item and version atomically, then saves a new draft version", async () => {
    const uid = await signInTestUser();
    const campaign = adminDb.collection("campaigns").doc();
    await campaign.set({ dmId: uid, memberIds: [] });
    const mutate = httpsCallable<Record<string, unknown>, MutationResult>(
      getTestFunctions(),
      "mutateCustomItem"
    );
    const payload = {
      weaponKind: "grenade",
      name: "Test Grenade",
      type: "Grenade",
      class: "Thrown",
      damage: "Special",
      pen: "2",
      specialRules: "Defensive",
      weight: "2 kg",
      value: "2 Thrones",
      availability: "Average",
      source: "Custom",
    };

    const created = await mutate({
      action: "create",
      campaignId: campaign.id,
      category: "weapon",
      creator: { userId: uid, characterId: "character-1", characterName: "Acolyte" },
      data: payload,
      operationId: crypto.randomUUID(),
    });
    expect(created.data.customItemId).toBeTruthy();
    expect(created.data.versionId).toBeTruthy();

    const itemRef = campaign.collection("customItems").doc(created.data.customItemId);
    const versionRef = itemRef.collection("versions").doc(created.data.versionId);
    const [item, version] = await Promise.all([itemRef.get(), versionRef.get()]);
    expect(item.exists).toBe(true);
    expect(version.exists).toBe(true);
    expect(item.data()?.data).toEqual(payload);

    const updatedPayload = { ...payload, name: "Updated Grenade" };
    const saved = await mutate({
      action: "save-draft",
      campaignId: campaign.id,
      customItemId: itemRef.id,
      category: "weapon",
      creator: { userId: uid, characterId: "character-1", characterName: "Acolyte" },
      data: updatedPayload,
    });
    expect(saved.data.versionId).toBe(created.data.versionId);
    expect((await versionRef.get()).data()?.data).toEqual(updatedPayload);
    expect((await itemRef.get()).data()?.name).toBe("Updated Grenade");

    await mutate({ action: "publish", campaignId: campaign.id, customItemId: itemRef.id });
    expect((await itemRef.get()).data()?.status).toBe("published");
    expect((await versionRef.get()).data()?.status).toBe("published");
    await mutate({ action: "archive", campaignId: campaign.id, customItemId: itemRef.id });
    expect((await itemRef.get()).data()?.status).toBe("archived");
    await mutate({ action: "restore", campaignId: campaign.id, customItemId: itemRef.id });
    expect((await itemRef.get()).data()?.status).toBe("published");
    await mutate({ action: "archive", campaignId: campaign.id, customItemId: itemRef.id });
    await mutate({ action: "delete", campaignId: campaign.id, customItemId: itemRef.id });
    expect((await itemRef.get()).exists).toBe(false);
    expect((await versionRef.get()).exists).toBe(false);
  }, 20_000);

  it("rejects a caller without access to the campaign", async () => {
    const ownerUid = await signInTestUser();
    const campaign = adminDb.collection("campaigns").doc();
    await campaign.set({ dmId: ownerUid, memberIds: [] });
    const callerUid = await signInTestUser();
    const mutate = httpsCallable<Record<string, unknown>, MutationResult>(
      getTestFunctions(),
      "mutateCustomItem"
    );
    await expect(
      mutate({
        action: "create",
        campaignId: campaign.id,
        category: "gear",
        creator: { userId: callerUid },
        data: { name: "Unauthorized" },
        operationId: crypto.randomUUID(),
      })
    ).rejects.toThrow();
  }, 20_000);
});
