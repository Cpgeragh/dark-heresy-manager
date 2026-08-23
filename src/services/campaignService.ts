// src/services/campaignService.ts
// Firestore operations for campaign documents.

import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentReference,
} from "firebase/firestore";
import { db } from "../firebase";
import type { CampaignDocument } from "../types/Firestore";
import { deleteRefsAtomically } from "../utils/firestoreBatchDelete";
import { validateCampaignName } from "../utils/validation";
import { assertFirestoreDocumentId, assertString } from "../utils/firebaseValidation";
import { runSingleFlight } from "../utils/singleFlight";
import {
  assertSafeDestructivePreflight,
  BoundedDeletionCollector,
  type DestructiveOperationPreflight,
} from "../utils/destructiveOperationPreflight";

/**
 * Creates a new campaign owned by the given DM.
 * Returns the new campaign's Firestore document ID.
 */
export async function createCampaign(name: string, dmId: string): Promise<string> {
  assertString(name, "Campaign name");
  const trimmedName = name.trim();
  const validation = validateCampaignName(trimmedName);
  if (!validation.isValid) throw new Error(validation.error);
  assertFirestoreDocumentId(dmId, "Campaign owner ID");

  return runSingleFlight("campaign:create", [dmId, trimmedName], async () => {
    const newRef = doc(collection(db, "campaigns"));

    const campaignData: CampaignDocument = {
      name: trimmedName,
      dmId,
      memberIds: [],
      createdAt: new Date(),
      archivedAt: null,
    };

    await setDoc(newRef, campaignData);
    return newRef.id;
  });
}

/**
 * Updates the name of an existing campaign.
 */
export async function updateCampaignName(campaignId: string, name: string): Promise<void> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertString(name, "Campaign name");
  const trimmedName = name.trim();
  const validation = validateCampaignName(trimmedName);
  if (!validation.isValid) throw new Error(validation.error);

  await runSingleFlight("campaign:rename", [campaignId, trimmedName], () =>
    updateDoc(doc(db, "campaigns", campaignId), { name: trimmedName })
  );
}

/**
 * Soft-deletes a campaign by stamping archivedAt with the current server time.
 * Archived campaigns are excluded from active campaign subscriptions.
 */
export async function archiveCampaign(campaignId: string): Promise<void> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  await runSingleFlight("campaign:archive", [campaignId], () =>
    updateDoc(doc(db, "campaigns", campaignId), {
      archivedAt: serverTimestamp(),
    })
  );
}

/**
 * Restores an archived campaign so it reappears in active subscriptions.
 */
export async function restoreCampaign(campaignId: string): Promise<void> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  await runSingleFlight("campaign:restore", [campaignId], () =>
    updateDoc(doc(db, "campaigns", campaignId), {
      archivedAt: null,
    })
  );
}

interface CampaignDeletionPlan {
  preflight: DestructiveOperationPreflight;
  references: DocumentReference[];
}

async function buildCampaignDeletionPlan(campaignId: string): Promise<CampaignDeletionPlan> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  const collector = new BoundedDeletionCollector();
  const campaignRef = doc(db, "campaigns", campaignId);
  const campaignSnapshot = await getDoc(campaignRef);
  collector.addSnapshot(campaignSnapshot, "campaigns");

  if (!campaignSnapshot.exists()) {
    return { preflight: collector.result(false), references: [] };
  }

  let unsafeReason: string | undefined;
  const characters = await collector.addQuery(
    collection(db, "campaigns", campaignId, "characters"),
    "characters"
  );
  for (const character of characters) {
    if (collector.exceeded) break;
    await collector.addQuery(collection(character.ref, "claimLog"), "claimLogs");
    if (collector.exceeded) break;
    await collector.addQuery(collection(character.ref, "xpProposals"), "xpProposals");
    if (collector.exceeded) break;

    const recoveryCode = (character.data() as { recoveryCode?: unknown }).recoveryCode;
    if (typeof recoveryCode !== "string" || !/^DH-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(recoveryCode)) {
      unsafeReason ??=
        "At least one character has no usable Recovery Code, so its Recovery Index cannot be removed safely.";
      continue;
    }
    collector.addSnapshot(await getDoc(doc(db, "recoveryIndex", recoveryCode)), "recoveryIndex");
  }

  if (!collector.exceeded) {
    await collector.addQuery(collection(db, "campaigns", campaignId, "sessions"), "sessions");
  }

  if (!collector.exceeded) {
    const threads = await collector.addQuery(
      collection(db, "campaigns", campaignId, "threads"),
      "threads"
    );
    for (const thread of threads) {
      if (collector.exceeded) break;
      await collector.addQuery(collection(thread.ref, "messages"), "messages");
    }
  }

  if (!collector.exceeded) {
    const customItems = await collector.addQuery(
      collection(db, "campaigns", campaignId, "customItems"),
      "customItems"
    );
    for (const customItem of customItems) {
      if (collector.exceeded) break;
      await collector.addQuery(collection(customItem.ref, "versions"), "customItemVersions");
    }
  }

  const preflight = collector.result(true, unsafeReason);
  return {
    preflight,
    references: preflight.safe ? collector.references() : [],
  };
}

export async function preflightCampaignDeletion(
  campaignId: string
): Promise<DestructiveOperationPreflight> {
  return (await buildCampaignDeletionPlan(campaignId)).preflight;
}

/**
 * Deletes a campaign and all known descendants in one atomic batch after a
 * bounded preflight. Campaigns over the client safety ceiling wait for the
 * protected resumable bulk job instead of being partially deleted.
 */
export async function deleteCampaign(campaignId: string): Promise<void> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  await runSingleFlight("campaign:delete", [campaignId], async () => {
    const plan = await buildCampaignDeletionPlan(campaignId);
    assertSafeDestructivePreflight(plan.preflight, "Campaign");
    await deleteRefsAtomically(db, plan.references);
  });
}
