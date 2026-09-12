import fs from "node:fs/promises";
import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

function parseArguments(values) {
  const options = { apply: false };
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--apply") options.apply = true;
    else if (value === "--project") options.projectId = values[++index];
    else if (value === "--old-account-id") options.oldAccountId = values[++index];
    else if (value === "--new-account-id") options.newAccountId = values[++index];
    else if (value === "--confirm-project") options.confirmProject = values[++index];
    else throw new Error(`Unknown argument: ${value}`);
  }
  if (!options.projectId) throw new Error("Pass --project with the exact Firebase project id.");
  if (options.apply && options.confirmProject !== options.projectId) {
    throw new Error("Applying requires --confirm-project with the same exact project id.");
  }
  return options;
}

function isPlainObject(value) {
  if (!value || typeof value !== "object") return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function replaceAccountId(value, oldAccountId, newAccountId) {
  if (value === oldAccountId) return newAccountId;
  if (Array.isArray(value)) {
    return value.map((entry) => replaceAccountId(entry, oldAccountId, newAccountId));
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        replaceAccountId(entry, oldAccountId, newAccountId),
      ])
    );
  }
  return value;
}

function containsAccountId(value, accountId) {
  if (value === accountId) return true;
  if (Array.isArray(value)) return value.some((entry) => containsAccountId(entry, accountId));
  return Boolean(
    isPlainObject(value) &&
    Object.values(value).some((entry) => containsAccountId(entry, accountId))
  );
}

async function listDocumentsRecursively(collectionReference, documents) {
  const snapshot = await collectionReference.get();
  for (const document of snapshot.docs) {
    documents.push(document);
    for (const childCollection of await document.ref.listCollections()) {
      await listDocumentsRecursively(childCollection, documents);
    }
  }
}

function serialiseForBackup(value) {
  if (Array.isArray(value)) return value.map(serialiseForBackup);
  if (value && typeof value === "object") {
    if (typeof value.toDate === "function") return { __timestamp: value.toDate().toISOString() };
    if (Buffer.isBuffer(value)) return { __bytes: value.toString("base64") };
    if (typeof value.path === "string" && value.constructor?.name === "DocumentReference") {
      return { __reference: value.path };
    }
    if (typeof value.latitude === "number" && typeof value.longitude === "number") {
      return { __geopoint: [value.latitude, value.longitude] };
    }
    if (isPlainObject(value)) {
      return Object.fromEntries(
        Object.entries(value).map(([key, entry]) => [key, serialiseForBackup(entry)])
      );
    }
    return { __type: value.constructor?.name ?? "Object", value: String(value) };
  }
  return value;
}

async function discoverOldAccountId(db) {
  const campaigns = await db.collection("campaigns").get();
  const ids = new Set(
    campaigns.docs
      .map((document) => document.data().dmId)
      .filter((value) => typeof value === "string" && value.length > 0)
  );
  if (ids.size !== 1) {
    throw new Error(
      `Automatic discovery requires exactly one campaign owner; found ${ids.size}. Pass --old-account-id.`
    );
  }
  return [...ids][0];
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  initializeApp({ projectId: options.projectId });
  const db = getFirestore();
  const oldAccountId = options.oldAccountId ?? (await discoverOldAccountId(db));
  const newAccountId = options.newAccountId ?? db.collection("accounts").doc().id;
  if (!oldAccountId || oldAccountId.includes("/") || !newAccountId || newAccountId.includes("/")) {
    throw new Error("Account ids must be valid Firestore document ids.");
  }
  if (oldAccountId === newAccountId) throw new Error("The old and new account ids must differ.");

  const oldAccountRef = db.collection("accounts").doc(oldAccountId);
  const newAccountRef = db.collection("accounts").doc(newAccountId);
  const oldProfileRef = db.collection("userProfiles").doc(oldAccountId);
  const newProfileRef = db.collection("userProfiles").doc(newAccountId);
  const oldSecretRef = db.collection("identitySecret").doc(oldAccountId);
  const newSecretRef = db.collection("identitySecret").doc(newAccountId);
  const originalDeviceLinkRef = db.collection("userLinks").doc(oldAccountId);

  const [oldAccount, newAccount, oldProfile, newProfile, oldSecret, newSecret, oldDeviceLink] =
    await Promise.all([
      oldAccountRef.get(),
      newAccountRef.get(),
      oldProfileRef.get(),
      newProfileRef.get(),
      oldSecretRef.get(),
      newSecretRef.get(),
      originalDeviceLinkRef.get(),
    ]);
  if (oldAccount.exists)
    throw new Error("The old id already has an account record; migration may already be complete.");
  if (newAccount.exists || newProfile.exists || newSecret.exists) {
    throw new Error("The requested new account id is already in use.");
  }
  if (!oldProfile.exists || !oldSecret.exists) {
    throw new Error("The old account must have both a profile and an identity secret.");
  }
  if (oldDeviceLink.exists && oldDeviceLink.data().primaryUid !== oldAccountId) {
    throw new Error("The original device is already connected to a different account.");
  }

  const campaignDocuments = [];
  await listDocumentsRecursively(db.collection("campaigns"), campaignDocuments);
  const changedCampaignDocuments = campaignDocuments.filter((document) =>
    containsAccountId(document.data(), oldAccountId)
  );
  const linkedDevices = await db
    .collection("userLinks")
    .where("primaryUid", "==", oldAccountId)
    .get();
  const recoveryIndexes = await db
    .collection("identityRecoveryIndex")
    .where("uid", "==", oldAccountId)
    .get();

  const writeCount =
    changedCampaignDocuments.length + linkedDevices.size + recoveryIndexes.size + 6;
  if (writeCount > 450) {
    throw new Error(
      `Migration needs ${writeCount} writes; split it before applying (safe limit: 450).`
    );
  }

  const summary = {
    projectId: options.projectId,
    oldAccountId,
    newAccountId,
    campaignDocumentsUpdated: changedCampaignDocuments.length,
    existingDeviceLinksUpdated: linkedDevices.size,
    recoveryIndexesUpdated: recoveryIndexes.size,
    totalWrites: writeCount,
  };
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (!options.apply) {
    process.stdout.write(
      "Dry run only. Re-run with --apply and the exact --confirm-project value.\n"
    );
    return;
  }

  const backup = {
    createdAt: new Date().toISOString(),
    summary,
    documents: [
      oldProfile,
      oldSecret,
      oldDeviceLink,
      ...changedCampaignDocuments,
      ...linkedDevices.docs,
      ...recoveryIndexes.docs,
    ]
      .filter((document) => document.exists)
      .map((document) => ({ path: document.ref.path, data: serialiseForBackup(document.data()) })),
  };
  const backupPath = `account-migration-backup-${Date.now()}.json`;
  await fs.writeFile(backupPath, `${JSON.stringify(backup, null, 2)}\n`, { flag: "wx" });

  const batch = db.batch();
  batch.create(newAccountRef, {
    status: "active",
    createdAt: FieldValue.serverTimestamp(),
    migratedFrom: oldAccountId,
  });
  batch.create(newProfileRef, oldProfile.data());
  batch.delete(oldProfileRef);
  batch.create(newSecretRef, oldSecret.data());
  batch.delete(oldSecretRef);
  for (const document of changedCampaignDocuments) {
    batch.set(document.ref, replaceAccountId(document.data(), oldAccountId, newAccountId));
  }
  for (const document of linkedDevices.docs) {
    batch.update(document.ref, { primaryUid: newAccountId });
  }
  if (!oldDeviceLink.exists) {
    batch.create(originalDeviceLinkRef, {
      primaryUid: newAccountId,
      linkedAt: FieldValue.serverTimestamp(),
    });
  }
  for (const document of recoveryIndexes.docs) batch.update(document.ref, { uid: newAccountId });
  await batch.commit();
  process.stdout.write(`Migration complete. Backup written to ${backupPath}.\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
