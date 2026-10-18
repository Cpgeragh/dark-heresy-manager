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

describe("Functions: session lifecycle", () => {
  afterAll(async () => {
    await teardownTestFunctions();
  });

  it("starts one open session at a time and closes it with the XP applied", async () => {
    const dmUid = await signInTestUser();
    const campaignRef = adminDb.collection("campaigns").doc();
    const characterRef = campaignRef.collection("characters").doc();
    await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
    await characterRef.set({
      campaignId: campaignRef.id,
      userId: null,
      isEditableByPlayer: false,
      experience: { total: 100, spent: 0, ranks: [] },
    });

    const startSession = httpsCallable(getTestFunctions(), "startSession");
    const closeSession = httpsCallable(getTestFunctions(), "closeSession");

    await startSession({
      campaignId: campaignRef.id,
      date: "2026-10-17",
      attendees: [characterRef.id],
      operationId: crypto.randomUUID(),
    });

    const sessions = await campaignRef.collection("sessions").get();
    expect(sessions.size).toBe(1);
    const sessionRef = sessions.docs[0].ref;
    expect(sessions.docs[0].data()).toEqual(
      expect.objectContaining({ status: "open", xpAwarded: 0, summary: "", dmNotes: "" })
    );
    expect(
      (await campaignRef.collection("sessionSummaries").doc(sessionRef.id).get()).data()
    ).toEqual(expect.objectContaining({ status: "open", xpAwarded: 0 }));

    await expect(
      startSession({
        campaignId: campaignRef.id,
        date: "2026-10-18",
        attendees: [characterRef.id],
        operationId: crypto.randomUUID(),
      })
    ).rejects.toMatchObject({ code: "functions/failed-precondition" });
    expect((await campaignRef.collection("sessions").get()).size).toBe(1);

    await expect(
      closeSession({
        campaignId: campaignRef.id,
        sessionId: sessionRef.id,
        xpAwarded: 150,
        attendees: [characterRef.id],
        operationId: crypto.randomUUID(),
      })
    ).rejects.toMatchObject({ code: "functions/failed-precondition" });
    expect((await sessionRef.get()).data()?.status).toBe("open");

    await sessionRef.update({ summary: "The acolytes survived.", dmNotes: "Private note" });
    await campaignRef
      .collection("sessionSummaries")
      .doc(sessionRef.id)
      .update({ summary: "The acolytes survived." });

    await closeSession({
      campaignId: campaignRef.id,
      sessionId: sessionRef.id,
      xpAwarded: 150,
      attendees: [characterRef.id],
      operationId: crypto.randomUUID(),
    });

    expect((await characterRef.get()).data()?.experience).toEqual({
      total: 250,
      spent: 0,
      ranks: [],
    });
    expect((await sessionRef.get()).data()).toEqual(
      expect.objectContaining({
        status: "closed",
        xpApplied: true,
        xpAwarded: 150,
        summary: "The acolytes survived.",
        dmNotes: "Private note",
      })
    );
    expect(
      (await campaignRef.collection("sessionSummaries").doc(sessionRef.id).get()).data()
    ).toEqual(expect.objectContaining({ status: "closed", xpApplied: true, xpAwarded: 150 }));
    expect(
      (
        await characterRef.collection("xpHistory").doc(`session-award-${sessionRef.id}`).get()
      ).data()
    ).toEqual(expect.objectContaining({ amountXp: 150, balanceXp: 250, source: "session-award" }));

    await expect(
      closeSession({
        campaignId: campaignRef.id,
        sessionId: sessionRef.id,
        xpAwarded: 150,
        attendees: [characterRef.id],
        operationId: crypto.randomUUID(),
      })
    ).rejects.toMatchObject({ code: "functions/failed-precondition" });
    expect((await characterRef.get()).data()?.experience.total).toBe(250);

    await startSession({
      campaignId: campaignRef.id,
      date: "2026-10-24",
      attendees: [characterRef.id],
      operationId: crypto.randomUUID(),
    });
    expect((await campaignRef.collection("sessions").get()).size).toBe(2);
  }, 30000);
});
