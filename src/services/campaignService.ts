// src/services/campaignService.ts
// Firestore operations for campaign documents.

import {
  collection,
  deleteField,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebase";
import type { CampaignDocument } from "../types/Firestore";
import { validateCampaignName, validateInquisitorName } from "../utils/validation";
import { assertFirestoreDocumentId, assertString } from "../utils/firebaseValidation";
import { runSingleFlight } from "../utils/singleFlight";
import { driveJobToCompletion } from "../utils/bulkJobClient";
import { campaignsCollectionRef } from "../firebase/converters";
import { FIRESTORE_QUERY_LIMITS } from "../constants/firestoreLimits";

/**
 * Creates a new campaign owned by the given DM.
 * Returns the new campaign's Firestore document ID.
 */
export async function createCampaign(
  name: string,
  dmId: string,
  gmName?: string,
  inquisitorName?: string
): Promise<string> {
  assertString(name, "Campaign name");
  const trimmedName = name.trim();
  const validation = validateCampaignName(trimmedName);
  if (!validation.isValid) throw new Error(validation.error);
  assertFirestoreDocumentId(dmId, "Campaign owner ID");

  const trimmedGmName = gmName?.trim();
  const trimmedInquisitorName = inquisitorName?.trim();
  if (trimmedInquisitorName) {
    const inquisitorValidation = validateInquisitorName(trimmedInquisitorName);
    if (!inquisitorValidation.isValid) throw new Error(inquisitorValidation.error);
  }

  return runSingleFlight("campaign:create", [dmId, trimmedName], async () => {
    const newRef = doc(collection(db, "campaigns"));

    const campaignData: CampaignDocument = {
      name: trimmedName,
      dmId,
      memberIds: [],
      createdAt: new Date(),
      archivedAt: null,
      ...(trimmedGmName ? { gmName: trimmedGmName } : {}),
      ...(trimmedInquisitorName ? { inquisitorName: trimmedInquisitorName } : {}),
    };

    await setDoc(newRef, campaignData);
    return newRef.id;
  });
}

/**
 * Updates an existing campaign's name and Inquisitor name together.
 * Passing a blank Inquisitor name removes it entirely.
 */
export async function updateCampaignDetails(
  campaignId: string,
  name: string,
  inquisitorName?: string
): Promise<void> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertString(name, "Campaign name");
  const trimmedName = name.trim();
  const validation = validateCampaignName(trimmedName);
  if (!validation.isValid) throw new Error(validation.error);

  const trimmedInquisitorName = inquisitorName?.trim();
  if (trimmedInquisitorName) {
    const inquisitorValidation = validateInquisitorName(trimmedInquisitorName);
    if (!inquisitorValidation.isValid) throw new Error(inquisitorValidation.error);
  }

  await runSingleFlight(
    "campaign:update-details",
    [campaignId, trimmedName, trimmedInquisitorName ?? ""],
    () =>
      updateDoc(doc(db, "campaigns", campaignId), {
        name: trimmedName,
        inquisitorName: trimmedInquisitorName ? trimmedInquisitorName : deleteField(),
      })
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

/**
 * Updates the GM name shown to players across every campaign a user DMs.
 * Called whenever the DM's own first name changes.
 */
export async function syncGmNameAcrossCampaigns(dmId: string, gmName: string): Promise<void> {
  assertFirestoreDocumentId(dmId, "Campaign owner ID");
  assertString(gmName, "GM name");
  const trimmedName = gmName.trim();
  if (!trimmedName) return;

  const snapshot = await getDocs(
    query(
      campaignsCollectionRef(),
      where("dmId", "==", dmId),
      limit(FIRESTORE_QUERY_LIMITS.dmCampaignsForNameSync)
    )
  );
  if (snapshot.empty) return;

  const batch = writeBatch(db);
  snapshot.docs.forEach((campaignDoc) => batch.update(campaignDoc.ref, { gmName: trimmedName }));
  await batch.commit();
}

const callStartCampaignDeletionJob = httpsCallable<
  { campaignId: string },
  { jobId: string; totalCount: number }
>(functions, "startCampaignDeletionJob");

const callProcessCampaignDeletionChunk = httpsCallable<
  { jobId: string },
  { done: boolean; processedCount: number; totalCount: number }
>(functions, "processCampaignDeletionChunk");

/**
 * Starts a resumable campaign-deletion job and returns its exact document
 * count, without deleting anything yet — the preview step for a delete
 * confirmation. Pass the returned jobId to deleteCampaign to run it.
 */
export async function preflightCampaignDeletion(
  campaignId: string
): Promise<{ jobId: string; totalCount: number }> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  const { data } = await callStartCampaignDeletionJob({ campaignId });
  return data;
}

/**
 * Drives a campaign-deletion job (from preflightCampaignDeletion) to
 * completion via the resumable startCampaignDeletionJob/
 * processCampaignDeletionChunk Functions, chunked and resumable if a call
 * drops mid-way. onProgress, if given, is called after each chunk.
 */
export async function deleteCampaign(
  jobId: string,
  onProgress?: (progress: { processedCount: number; totalCount: number }) => void
): Promise<void> {
  await runSingleFlight("campaign:delete", [jobId], () =>
    driveJobToCompletion(
      jobId,
      async (id) => (await callProcessCampaignDeletionChunk({ jobId: id })).data,
      (chunk) => onProgress?.({ processedCount: chunk.processedCount, totalCount: chunk.totalCount })
    )
  );
}
