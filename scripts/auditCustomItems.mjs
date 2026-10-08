import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import {
  CUSTOM_ITEM_CATEGORIES,
  assertCustomItemCreatorData,
  assertCustomItemData,
  assertCustomItemDocumentId,
} from "shared-rules";

const projectId = process.env.CUSTOM_ITEM_SCAN_PROJECT_ID;
if (!projectId) {
  throw new Error("Set CUSTOM_ITEM_SCAN_PROJECT_ID to the exact Firebase project to scan.");
}

initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore();
const violations = [];
let campaignCount = 0;
let itemCount = 0;
let versionCount = 0;

function inspect(label, validate) {
  try {
    validate();
  } catch (error) {
    violations.push({
      document: label,
      reason: error instanceof Error ? error.message : String(error),
    });
  }
}

function inspectCreator(label, creator) {
  inspect(label, () => assertCustomItemCreatorData(creator, "Custom-item creator"));
}

const campaigns = await db.collection("campaigns").get();
campaignCount = campaigns.size;
for (const campaignDoc of campaigns.docs) {
  const items = await campaignDoc.ref.collection("customItems").get();
  itemCount += items.size;
  for (const itemDoc of items.docs) {
    const item = itemDoc.data();
    const itemLabel = itemDoc.ref.path;
    inspect(itemLabel, () => assertCustomItemDocumentId(itemDoc.id, "Custom-item ID"));
    if (item.id !== itemDoc.id)
      violations.push({
        document: itemLabel,
        reason: "Stored item ID does not match its document ID.",
      });
    if (item.campaignId !== campaignDoc.id)
      violations.push({
        document: itemLabel,
        reason: "Stored campaign ID does not match its parent.",
      });
    if (!CUSTOM_ITEM_CATEGORIES.includes(item.category))
      violations.push({ document: itemLabel, reason: "Custom-item category is invalid." });
    if (!["draft", "published", "archived"].includes(item.status))
      violations.push({ document: itemLabel, reason: "Custom-item status is invalid." });
    inspectCreator(itemLabel, item.creator);
    inspectCreator(itemLabel, item.createdBy);
    inspectCreator(itemLabel, item.updatedBy);
    inspect(itemLabel, () => assertCustomItemData(item.category, item.data));
    if (typeof item.name !== "string" || item.name !== item.data?.name?.trim()) {
      violations.push({ document: itemLabel, reason: "Item name does not match its data name." });
    }

    const versions = await itemDoc.ref.collection("versions").get();
    versionCount += versions.size;
    for (const versionDoc of versions.docs) {
      const version = versionDoc.data();
      const versionLabel = versionDoc.ref.path;
      inspect(versionLabel, () => assertCustomItemDocumentId(versionDoc.id, "Version ID"));
      if (version.id !== versionDoc.id)
        violations.push({
          document: versionLabel,
          reason: "Stored version ID does not match its document ID.",
        });
      if (version.campaignId !== campaignDoc.id || version.customItemId !== itemDoc.id) {
        violations.push({
          document: versionLabel,
          reason: "Version parent IDs do not match its path.",
        });
      }
      if (version.category !== item.category)
        violations.push({
          document: versionLabel,
          reason: "Version category does not match its item.",
        });
      if (
        !Number.isInteger(version.versionNumber) ||
        version.versionNumber < 1 ||
        version.versionNumber > 50
      ) {
        violations.push({
          document: versionLabel,
          reason: "Version number is outside the supported range.",
        });
      }
      if (!["draft", "published"].includes(version.status))
        violations.push({ document: versionLabel, reason: "Version status is invalid." });
      inspectCreator(versionLabel, version.createdBy);
      inspectCreator(versionLabel, version.updatedBy);
      inspect(versionLabel, () => assertCustomItemData(version.category, version.data));
    }
  }
}

console.log(
  JSON.stringify(
    {
      projectId,
      readOnly: true,
      campaignCount,
      itemCount,
      versionCount,
      violationCount: violations.length,
      violations,
    },
    null,
    2
  )
);
if (violations.length > 0) process.exitCode = 1;
