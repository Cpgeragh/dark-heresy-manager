import { afterAll, describe, expect, it } from "vitest";
import { deleteApp } from "firebase/app";
import { getApps, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { httpsCallable } from "firebase/functions";
import { createIndependentClient, teardownTestFunctions } from "./setup";

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
if (!getApps().length) initializeAdminApp({ projectId: "dh-test" });
const adminDb = getFirestore();

describe("Functions: permanent account lifecycle", () => {
  afterAll(async () => teardownTestFunctions());

  it("creates one account, connects another device, and warns before the last disconnect", async () => {
    const first = await createIndependentClient(`account-first-${Date.now()}`);
    const second = await createIndependentClient(`account-second-${Date.now()}`);
    try {
      await adminDb.collection("users").doc(first.uid).set({ onboarded: false });
      const createAccount = httpsCallable<
        { deviceName: string },
        { accountId: string; code: string }
      >(first.functions, "createAccount");
      const created = (await createAccount({ deviceName: "First phone" })).data;
      expect(created.accountId).not.toBe(first.uid);
      expect(
        (await adminDb.collection("accounts").doc(created.accountId).get()).data()?.status
      ).toBe("provisional");

      await adminDb.collection("userProfiles").doc(created.accountId).set({ firstName: "Iris" });
      await httpsCallable(first.functions, "completeOnboarding")({});
      expect(
        (await adminDb.collection("accounts").doc(created.accountId).get()).data()?.status
      ).toBe("active");

      await adminDb.collection("users").doc(second.uid).set({ onboarded: false });
      await httpsCallable<{ code: string; deviceName: string }, void>(
        second.functions,
        "linkDevice"
      )({ code: created.code, deviceName: "Second laptop" });
      await httpsCallable(second.functions, "completeOnboarding")({});
      expect((await adminDb.collection("userLinks").doc(second.uid).get()).data()?.primaryUid).toBe(
        created.accountId
      );

      const listed = (
        await httpsCallable<
          Record<string, never>,
          {
            devices: Array<{
              uid: string;
              name: string | null;
              linkedAt: number | null;
              isCurrentDevice: boolean;
            }>;
          }
        >(first.functions, "listLinkedDevices")({})
      ).data.devices;
      expect(listed).toHaveLength(2);
      expect(listed).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ uid: first.uid, name: "First phone", isCurrentDevice: true }),
          expect.objectContaining({
            uid: second.uid,
            name: "Second laptop",
            isCurrentDevice: false,
          }),
        ])
      );

      await httpsCallable(first.functions, "renameLinkedDevice")({
        targetDeviceUid: second.uid,
        name: "Old laptop",
      });
      expect((await adminDb.collection("userLinks").doc(second.uid).get()).data()?.name).toBe(
        "Old laptop"
      );

      const remotelyDisconnected = (
        await httpsCallable<
          { targetDeviceUid: string },
          { recoveryCode: string; remainingDeviceCount: number }
        >(first.functions, "disconnectOtherDevice")({ targetDeviceUid: second.uid })
      ).data;
      expect(remotelyDisconnected.remainingDeviceCount).toBe(1);
      expect(remotelyDisconnected.recoveryCode).not.toBe(created.code);
      expect((await adminDb.collection("userLinks").doc(second.uid).get()).exists).toBe(false);
      expect((await adminDb.collection("users").doc(second.uid).get()).data()?.onboarded).toBe(false);

      const disconnectFirst = httpsCallable(first.functions, "disconnectDevice");
      await expect(disconnectFirst({ confirmLastDevice: false })).rejects.toMatchObject({
        code: "functions/failed-precondition",
        details: { reason: "last-device" },
      });
      await disconnectFirst({ confirmLastDevice: true });
      expect((await adminDb.collection("userLinks").doc(first.uid).get()).exists).toBe(false);
    } finally {
      await Promise.all([deleteApp(first.app), deleteApp(second.app)]);
    }
  }, 30000);
});
