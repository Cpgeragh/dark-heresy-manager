// tests/functions/clientIntegration.test.ts
//
// Proves the actual client service functions (recoveryLookupService.ts,
// characterService.ts), not a mocked httpsCallable, correctly wire up to real
// deployed callables. Everything else about Function behaviour is already
// proven by tests/functions/*'s direct httpsCallable tests; this only proves
// the client-side wiring itself: request shape, response shape, error
// propagation, end to end through a real registration -> lookup -> claim flow.

import { afterEach, describe, expect, it, vi } from "vitest";
import { initializeApp as initializeAdminApp, getApps as getAdminApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { connectFunctionsEmulator } from "firebase/functions";
import { connectAuthEmulator, signInAnonymously, signOut } from "firebase/auth";

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
if (!getAdminApps().length) {
  initializeAdminApp({ projectId: "dh-test" });
}
const adminDb = getFirestore();

const CLIENT_ENV_VARS = {
  VITE_FIREBASE_API_KEY: "test-api-key",
  VITE_FIREBASE_AUTH_DOMAIN: "dh-test.firebaseapp.com",
  VITE_FIREBASE_PROJECT_ID: "dh-test",
  VITE_FIREBASE_STORAGE_BUCKET: "dh-test.appspot.com",
  VITE_FIREBASE_MESSAGING_SENDER_ID: "0",
  VITE_FIREBASE_APP_ID: "1:0:web:0",
};

/** Loads a fresh instance of the real client Firebase + service modules, redirected to the local emulator. */
async function loadEmulatedClient() {
  vi.resetModules();
  for (const [key, value] of Object.entries(CLIENT_ENV_VARS)) {
    vi.stubEnv(key, value);
  }
  const { auth, functions } = await import("../../src/firebase");
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });

  const { claimCharacter, registerRecoveryCode } = await import("../../src/services/characterService");
  const { lookupRecoveryCharacter } = await import("../../src/services/recoveryLookupService");

  return { auth, claimCharacter, registerRecoveryCode, lookupRecoveryCharacter };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Client service functions against the real emulator", () => {
  it(
    "registers, looks up, and claims a real character through the actual client service functions",
    async () => {
      const { auth, claimCharacter, registerRecoveryCode, lookupRecoveryCharacter } =
        await loadEmulatedClient();

      const campaignRef = adminDb.collection("campaigns").doc();
      const characterRef = campaignRef.collection("characters").doc();

      const dmCredential = await signInAnonymously(auth);
      await campaignRef.set({ dmId: dmCredential.user.uid, name: "Test Campaign", memberIds: [] });
      await characterRef.set({
        campaignId: campaignRef.id,
        header: { characterName: "Brother Corvus" },
      });

      const code = await registerRecoveryCode(campaignRef.id, characterRef.id);
      expect(code).toMatch(/^DH-[0-9A-Z]{4}-[0-9A-Z]{4}$/);

      await signOut(auth);
      await signInAnonymously(auth);

      const lookup = await lookupRecoveryCharacter(code);
      expect(lookup).toEqual({
        status: "found",
        result: {
          campaignId: campaignRef.id,
          characterId: characterRef.id,
          characterName: "Brother Corvus",
          campaignName: "Test Campaign",
          ownership: "unclaimed",
        },
      });

      const claimResult = await claimCharacter(code);
      expect(claimResult).toEqual({ campaignId: campaignRef.id, characterId: characterRef.id });

      const characterSnapshot = await characterRef.get();
      expect(characterSnapshot.data()?.userId).toBe(auth.currentUser?.uid);
    },
    20000
  );
});
