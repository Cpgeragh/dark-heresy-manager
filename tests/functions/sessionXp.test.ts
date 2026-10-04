import { afterAll, describe, expect, it } from "vitest";
import { httpsCallable } from "firebase/functions";
import { initializeApp as initializeAdminApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getTestFunctions, signInTestUser, teardownTestFunctions } from "./setup";

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
if (!getApps().length) {
  initializeAdminApp({ projectId: "dh-test" });
}
const adminDb = getFirestore();

describe("Functions: session XP", () => {
  afterAll(async () => {
    await teardownTestFunctions();
  });

  it("applies and reverses a session award with matching history entries", async () => {
    const dmUid = await signInTestUser();
    const campaignRef = adminDb.collection("campaigns").doc();
    const characterRef = campaignRef.collection("characters").doc();
    const sessionRef = campaignRef.collection("sessions").doc();
    const summaryRef = campaignRef.collection("sessionSummaries").doc(sessionRef.id);
    await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
    await characterRef.set({
      campaignId: campaignRef.id,
      userId: null,
      isEditableByPlayer: false,
      experience: { total: 100, spent: 0, ranks: [] },
    });
    await sessionRef.set({
      campaignId: campaignRef.id,
      attendees: [characterRef.id],
      xpAwarded: 100,
      summary: "The acolytes survived.",
      xpApplied: false,
    });
    await summaryRef.set({ campaignId: campaignRef.id, xpApplied: false });

    const applySessionXp = httpsCallable(getTestFunctions(), "applySessionXp");
    await applySessionXp({
      campaignId: campaignRef.id,
      sessionId: sessionRef.id,
      operationId: crypto.randomUUID(),
    });

    expect((await characterRef.get()).data()?.experience).toEqual({
      total: 200,
      spent: 0,
      ranks: [],
    });
    expect((await sessionRef.get()).data()?.xpApplied).toBe(true);
    expect((await summaryRef.get()).data()?.xpApplied).toBe(true);
    expect(
      (
        await characterRef.collection("xpHistory").doc(`session-award-${sessionRef.id}`).get()
      ).data()
    ).toEqual(
      expect.objectContaining({
        amountXp: 100,
        balanceXp: 200,
        source: "session-award",
        sessionId: sessionRef.id,
      })
    );

    const deleteSession = httpsCallable(getTestFunctions(), "deleteSession");
    await deleteSession({
      campaignId: campaignRef.id,
      sessionId: sessionRef.id,
      reverseXp: true,
      operationId: crypto.randomUUID(),
    });

    expect((await characterRef.get()).data()?.experience).toEqual({
      total: 100,
      spent: 0,
      ranks: [],
    });
    expect((await sessionRef.get()).exists).toBe(false);
    expect((await summaryRef.get()).exists).toBe(false);
    expect(
      (
        await characterRef.collection("xpHistory").doc(`session-reversal-${sessionRef.id}`).get()
      ).data()
    ).toEqual(
      expect.objectContaining({
        amountXp: -100,
        balanceXp: 100,
        source: "session-reversal",
        sessionId: sessionRef.id,
      })
    );
  }, 15000);

  it("rejects the complete award when one attendee has invalid purchase data", async () => {
    const dmUid = await signInTestUser();
    const campaignRef = adminDb.collection("campaigns").doc();
    const validCharacterRef = campaignRef.collection("characters").doc();
    const invalidCharacterRef = campaignRef.collection("characters").doc();
    const sessionRef = campaignRef.collection("sessions").doc();
    const summaryRef = campaignRef.collection("sessionSummaries").doc(sessionRef.id);
    await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
    await validCharacterRef.set({
      campaignId: campaignRef.id,
      userId: null,
      isEditableByPlayer: false,
      experience: { total: 100, spent: 0, ranks: [] },
    });
    await invalidCharacterRef.set({
      campaignId: campaignRef.id,
      userId: null,
      isEditableByPlayer: false,
      experience: { total: 100, spent: 0, ranks: [{ rank: 1, advances: "invalid" }] },
    });
    await sessionRef.set({
      campaignId: campaignRef.id,
      attendees: [validCharacterRef.id, invalidCharacterRef.id],
      xpAwarded: 100,
      summary: "Atomic award",
      xpApplied: false,
    });
    await summaryRef.set({ campaignId: campaignRef.id, xpApplied: false });

    const applySessionXp = httpsCallable(getTestFunctions(), "applySessionXp");
    await expect(
      applySessionXp({
        campaignId: campaignRef.id,
        sessionId: sessionRef.id,
        operationId: crypto.randomUUID(),
      })
    ).rejects.toMatchObject({ code: "functions/failed-precondition" });

    expect((await validCharacterRef.get()).data()?.experience).toEqual({
      total: 100,
      spent: 0,
      ranks: [],
    });
    expect((await sessionRef.get()).data()?.xpApplied).toBe(false);
    expect((await summaryRef.get()).data()?.xpApplied).toBe(false);
    expect((await validCharacterRef.collection("xpHistory").get()).empty).toBe(true);
  }, 15000);
});
