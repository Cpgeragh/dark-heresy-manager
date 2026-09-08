import { afterEach, describe, expect, it, vi } from "vitest";
import { PRODUCT_LIMITS } from "../../src/constants/productLimits";
import { assertCharacterPayload } from "../../src/firestore/firebaseValidation";
import {
  buildPerformanceProfile,
  characterDocumentFromProfile,
  PERFORMANCE_PROFILE_NAMES,
  serialisedBytes,
} from "../../scripts/performanceFixtures.mjs";
import {
  configureEmulatorOnlyEnvironment,
  PERFORMANCE_EMULATOR,
} from "../../scripts/seedPerformanceFixtures.mjs";
import {
  createPerformanceEnvironment,
  PERFORMANCE_PROJECT_ID,
} from "../../scripts/performanceEnvironmentConfig.mjs";

const ENVIRONMENT_NAMES = [
  "GCLOUD_PROJECT",
  "FIRESTORE_EMULATOR_HOST",
  "FIREBASE_AUTH_EMULATOR_HOST",
] as const;
const originalEnvironment = Object.fromEntries(
  ENVIRONMENT_NAMES.map((name) => [name, process.env[name]])
);

afterEach(() => {
  vi.unstubAllEnvs();
  for (const name of ENVIRONMENT_NAMES) {
    const original = originalEnvironment[name];
    if (original === undefined) delete process.env[name];
    else process.env[name] = original;
  }
});

describe("performance fixture profiles", () => {
  it("defines every agreed baseline profile with a deterministic route", () => {
    expect(PERFORMANCE_PROFILE_NAMES).toEqual([
      "new-account",
      "empty",
      "small",
      "large-character",
      "large-dm",
      "long-thread",
    ]);

    for (const profileName of PERFORMANCE_PROFILE_NAMES) {
      const first = buildPerformanceProfile(profileName, "performance-user");
      const second = buildPerformanceProfile(profileName, "performance-user");
      expect(first).toEqual(second);
      expect(first.route).toMatch(/^\//u);
    }
  });

  it("keeps the large character valid and below the agreed document headroom", () => {
    const profile = buildPerformanceProfile("large-character", "performance-user");
    const character = characterDocumentFromProfile(
      profile,
      profile.campaignId!,
      profile.characterId!
    );

    expect(character).toBeDefined();
    expect(() => assertCharacterPayload(character, true)).not.toThrow();
    expect(serialisedBytes(character)).toBeLessThan(850_000);
    expect((character!.gear as unknown[]).length).toBe(180);
    expect((character!.rangedWeapons as unknown[]).length).toBe(180);
    expect((character!.skills as unknown[]).length).toBe(180);
    expect((character!.talentsAndTraits as { talents: unknown[] }).talents.length).toBe(180);
    expect(character!.header).toMatchObject({ career: "Adept", rank: "Archivist" });
    expect(character!.rangedWeapons[0]).toMatchObject({
      custom: true,
      ammoType: "Bullets",
      ammoEntries: [
        expect.objectContaining({
          id: "ammo-1",
          referenceId: "cr-bullets",
          rounds: 12,
          loaded: true,
        }),
      ],
      loadedAmmoByProfile: expect.objectContaining({ Primary: "ammo-1" }),
    });
    expect(PRODUCT_LIMITS.characterArrayEntries).toBe(200);
  });

  it("creates the documented large-DM and long-thread loads", () => {
    const largeDm = buildPerformanceProfile("large-dm", "performance-user");
    const longThread = buildPerformanceProfile("long-thread", "performance-user");

    expect(largeDm.writes.filter((write) => /^campaigns\/[^/]+$/u.test(write.path))).toHaveLength(
      45
    );
    expect(largeDm.writes.filter((write) => /\/characters\/[^/]+$/u.test(write.path))).toHaveLength(
      90
    );
    expect(largeDm.writes.filter((write) => /\/sessions\/[^/]+$/u.test(write.path))).toHaveLength(
      180
    );
    expect(
      largeDm.writes.filter((write) => /\/customItems\/[^/]+$/u.test(write.path))
    ).toHaveLength(180);
    expect(
      longThread.writes.filter((write) => /\/messages\/[^/]+$/u.test(write.path))
    ).toHaveLength(300);
  });

  it("uses a real character creator shape for custom-library fixtures", () => {
    const small = buildPerformanceProfile("small", "performance-user");
    const customItem = small.writes.find((write) =>
      /\/customItems\/custom-item-001$/u.test(write.path)
    );

    expect(customItem?.data.creator).toEqual({
      userId: "performance-user",
      characterId: "small-character-001",
      characterName: "Small Acolyte 1",
    });
  });
});

describe("performance seeder safety", () => {
  it("pins every destination to the local dh-test emulators", () => {
    for (const name of ENVIRONMENT_NAMES) delete process.env[name];

    configureEmulatorOnlyEnvironment();

    expect(process.env.GCLOUD_PROJECT).toBe(PERFORMANCE_EMULATOR.projectId);
    expect(process.env.FIRESTORE_EMULATOR_HOST).toBe(PERFORMANCE_EMULATOR.firestoreHost);
    expect(process.env.FIREBASE_AUTH_EMULATOR_HOST).toBe(PERFORMANCE_EMULATOR.authHost);
  });

  it.each([
    ["GCLOUD_PROJECT", "production-project"],
    ["FIRESTORE_EMULATOR_HOST", "firebase.googleapis.com"],
    ["FIREBASE_AUTH_EMULATOR_HOST", "identitytoolkit.googleapis.com"],
  ] as const)("rejects a conflicting %s destination", (name, value) => {
    for (const environmentName of ENVIRONMENT_NAMES) delete process.env[environmentName];
    vi.stubEnv(name, value);

    expect(() => configureEmulatorOnlyEnvironment()).toThrow(name);
  });
});

describe("performance application environment safety", () => {
  it("builds every browser and Admin destination for dh-test only", () => {
    const environment = createPerformanceEnvironment({}, "revision-a");

    expect(environment.VITE_FIREBASE_PROJECT_ID).toBe(PERFORMANCE_PROJECT_ID);
    expect(environment.GCLOUD_PROJECT).toBe(PERFORMANCE_PROJECT_ID);
    expect(environment.FIRESTORE_EMULATOR_HOST).toBe("127.0.0.1:8080");
    expect(environment.FIREBASE_AUTH_EMULATOR_HOST).toBe("127.0.0.1:9099");
    expect(environment.VITE_FIREBASE_APP_ID).toContain("revision-a");
  });

  it.each([
    ["VITE_FIREBASE_PROJECT_ID", "dark-heresy-manager"],
    ["GCLOUD_PROJECT", "dark-heresy-manager"],
    ["FIRESTORE_EMULATOR_HOST", "firestore.googleapis.com"],
    ["FIREBASE_AUTH_EMULATOR_HOST", "identitytoolkit.googleapis.com"],
  ])("rejects a conflicting %s destination", (name, value) => {
    expect(() => createPerformanceEnvironment({ [name]: value })).toThrow(name);
  });
});
