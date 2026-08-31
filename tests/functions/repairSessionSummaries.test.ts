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

describe("Functions: repairSessionSummaries", () => {
  afterAll(async () => {
    await teardownTestFunctions();
  });

  it(
    "rebuilds member-safe summaries without copying DM notes",
    async () => {
      const dmUid = await signInTestUser();
      const campaignRef = adminDb.collection("campaigns").doc();
      await campaignRef.set({ dmId: dmUid, name: "Migration Test", memberIds: [] });
      await campaignRef.collection("sessions").doc("session-1").set({
        date: new Date("2026-08-28T00:00:00.000Z"),
        summary: "Member-visible recap",
        dmNotes: "Private clue",
        xpAwarded: 100,
        attendees: ["character-1"],
        createdAt: new Date("2026-08-28T00:00:00.000Z"),
        xpApplied: false,
      });

      const repair = httpsCallable<
        { campaignId: string },
        { repairedCount: number }
      >(getTestFunctions(), "repairSessionSummaries");
      const result = await repair({ campaignId: campaignRef.id });

      expect(result.data).toEqual({ repairedCount: 1 });
      const summary = (
        await campaignRef.collection("sessionSummaries").doc("session-1").get()
      ).data();
      expect(summary).toMatchObject({
        summary: "Member-visible recap",
        xpAwarded: 100,
        attendees: ["character-1"],
        xpApplied: false,
      });
      expect(summary).not.toHaveProperty("dmNotes");
    },
    20_000
  );

  it(
    "rejects a signed-in stranger without creating summaries",
    async () => {
      const dmUid = await signInTestUser();
      const campaignRef = adminDb.collection("campaigns").doc();
      await campaignRef.set({ dmId: dmUid, name: "Permission Test", memberIds: [] });
      await campaignRef.collection("sessions").doc("session-1").set({
        date: new Date(),
        summary: "Recap",
        dmNotes: "Private",
        xpAwarded: 0,
        attendees: [],
        createdAt: new Date(),
      });

      await signInTestUser();
      const repair = httpsCallable(getTestFunctions(), "repairSessionSummaries");

      await expect(repair({ campaignId: campaignRef.id })).rejects.toMatchObject({
        code: "functions/permission-denied",
      });
      expect((await campaignRef.collection("sessionSummaries").get()).empty).toBe(true);
    },
    20_000
  );
});
