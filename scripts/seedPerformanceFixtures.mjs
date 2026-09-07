import { fileURLToPath } from "node:url";
import path from "node:path";
import { buildPerformanceProfile, PERFORMANCE_PROFILE_NAMES } from "./performanceFixtures.mjs";

export const PERFORMANCE_EMULATOR = Object.freeze({
  projectId: "dh-test",
  firestoreHost: "127.0.0.1:8080",
  authHost: "127.0.0.1:9099",
});

function assertCompatibleEnvironment(name, expected) {
  const configured = process.env[name];
  if (configured && configured !== expected) {
    throw new Error(`${name} must be exactly ${expected}; received ${configured}.`);
  }
  process.env[name] = expected;
}

export function configureEmulatorOnlyEnvironment() {
  assertCompatibleEnvironment("GCLOUD_PROJECT", PERFORMANCE_EMULATOR.projectId);
  assertCompatibleEnvironment("FIRESTORE_EMULATOR_HOST", PERFORMANCE_EMULATOR.firestoreHost);
  assertCompatibleEnvironment("FIREBASE_AUTH_EMULATOR_HOST", PERFORMANCE_EMULATOR.authHost);
}

function parseArguments(argumentsList) {
  let profile = "small";
  let uid;

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === "--profile") {
      profile = argumentsList[index + 1];
      index += 1;
    } else if (argument === "--uid") {
      uid = argumentsList[index + 1];
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!PERFORMANCE_PROFILE_NAMES.includes(profile)) {
    throw new Error(`--profile must be one of: ${PERFORMANCE_PROFILE_NAMES.join(", ")}`);
  }
  if (uid !== undefined && (!uid || uid.includes("/"))) {
    throw new Error("--uid must be a valid emulator user id.");
  }
  return { profile, uid };
}

async function resolveUid(authentication, requestedUid) {
  const users = (await authentication.listUsers(2)).users;
  if (requestedUid) {
    if (!users.some((user) => user.uid === requestedUid)) {
      throw new Error(`The Auth emulator has no user named ${requestedUid}.`);
    }
    return requestedUid;
  }
  if (users.length !== 1) {
    throw new Error(
      users.length === 0
        ? "Open the performance app once so it can create its anonymous emulator account."
        : "More than one emulator account exists; pass the intended account with --uid."
    );
  }
  return users[0].uid;
}

async function resetFirestoreEmulator() {
  const endpoint = `http://${PERFORMANCE_EMULATOR.firestoreHost}/emulator/v1/projects/${PERFORMANCE_EMULATOR.projectId}/databases/(default)/documents`;
  const response = await fetch(endpoint, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(`Firestore emulator reset failed (${response.status}).`);
  }
}

async function seed({ profile, uid: requestedUid }) {
  configureEmulatorOnlyEnvironment();
  const [{ initializeApp }, { getAuth }, { getFirestore }] = await Promise.all([
    import("firebase-admin/app"),
    import("firebase-admin/auth"),
    import("firebase-admin/firestore"),
  ]);
  const app = initializeApp({ projectId: PERFORMANCE_EMULATOR.projectId }, "performance-seeder");
  const uid = await resolveUid(getAuth(app), requestedUid);
  await resetFirestoreEmulator();
  const database = getFirestore(app);
  const fixture = buildPerformanceProfile(profile, uid);
  const writer = database.bulkWriter();
  for (const write of fixture.writes) writer.set(database.doc(write.path), write.data);
  await writer.close();

  console.log(`Seeded ${profile} for emulator user ${uid}.`);
  console.log(`Wrote ${fixture.writes.length} document(s).`);
  console.log(`Open http://127.0.0.1:4175${fixture.route}`);
}

const isCommandLineEntry = process.argv[1]
  ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  : false;

if (isCommandLineEntry) {
  seed(parseArguments(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
