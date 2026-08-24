// functions/src/shared/identityMigration.ts
//
// Stage 3: computes the ownership-migration plan used by identity reclaim,
// and applies it one campaign at a time. Split into a cheap "which campaigns,
// how many total writes" plan (computeOwnershipMigrationPlan) and a per-
// campaign apply step (migrateCampaignOwnership) so a resumable bulk job can
// chunk the writes instead of requiring everything to fit one batch.

import type { Firestore, WriteBatch, DocumentReference } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

const CAMPAIGN_LIMIT = 200;
// Mirrors PRODUCT_LIMITS.charactersPerCampaign (src/constants/productLimits.ts) —
// a single user can never own more characters in one campaign than the campaign
// itself can ever hold. Duplicated, not imported: functions/ cannot import from src/.
const CHARACTERS_PER_CAMPAIGN_LIMIT = 100;

export type CampaignMigrationRole = "dm" | "member" | "both";

export interface CampaignMigrationEntry {
  campaignId: string;
  role: CampaignMigrationRole;
}

export interface OwnershipMigrationPlan {
  campaigns: CampaignMigrationEntry[];
  totalWriteCount: number;
}

function tooLargeError(): HttpsError {
  return new HttpsError(
    "resource-exhausted",
    "This account has too much data for a safe automatic migration. No ownership was changed."
  );
}

/**
 * Reads which campaigns the old identity DMs or is a member of, and how many
 * writes migrating each will need, without reading every character document
 * up front — only a count per campaign, so the plan itself stays small
 * regardless of how much data the account has.
 */
export async function computeOwnershipMigrationPlan(
  db: Firestore,
  oldUid: string
): Promise<OwnershipMigrationPlan> {
  const dmCampaignsSnap = await db
    .collection("campaigns")
    .where("dmId", "==", oldUid)
    .limit(CAMPAIGN_LIMIT + 1)
    .get();
  const playerCampaignsSnap = await db
    .collection("campaigns")
    .where("memberIds", "array-contains", oldUid)
    .limit(CAMPAIGN_LIMIT + 1)
    .get();

  if (
    dmCampaignsSnap.docs.length > CAMPAIGN_LIMIT ||
    playerCampaignsSnap.docs.length > CAMPAIGN_LIMIT
  ) {
    throw tooLargeError();
  }

  const roles = new Map<string, CampaignMigrationRole>();
  for (const doc of dmCampaignsSnap.docs) {
    roles.set(doc.id, "dm");
  }
  for (const doc of playerCampaignsSnap.docs) {
    roles.set(doc.id, roles.has(doc.id) ? "both" : "member");
  }

  const memberCampaignIds = [...roles.entries()]
    .filter(([, role]) => role !== "dm")
    .map(([campaignId]) => campaignId);

  const characterCounts = await Promise.all(
    memberCampaignIds.map((campaignId) =>
      db
        .collection("campaigns")
        .doc(campaignId)
        .collection("characters")
        .where("userId", "==", oldUid)
        .count()
        .get()
    )
  );

  let characterWriteCount = 0;
  for (const snap of characterCounts) {
    const count = snap.data().count;
    if (count > CHARACTERS_PER_CAMPAIGN_LIMIT) {
      throw tooLargeError();
    }
    characterWriteCount += count;
  }

  const campaigns = [...roles.entries()].map(([campaignId, role]) => ({ campaignId, role }));

  return { campaigns, totalWriteCount: campaigns.length + characterWriteCount };
}

/**
 * Migrates one campaign's ownership into an already-open batch: the campaign
 * document's dmId/memberIds (a single merged update, never two separate
 * writes to the same doc) and every character the old identity owns in it.
 * Reads the campaign's current memberIds and character list fresh rather
 * than trusting the plan, so a chunk is safe to retry and naturally picks up
 * any membership change that happened since the plan was computed. Returns
 * how many writes it added, so the caller can budget how many campaigns fit
 * in one chunk.
 */
export async function migrateCampaignOwnership(
  db: Firestore,
  batch: WriteBatch,
  entry: CampaignMigrationEntry,
  oldUid: string,
  newUid: string
): Promise<number> {
  const campaignRef = db.collection("campaigns").doc(entry.campaignId);
  const changes: { dmId?: string; memberIds?: string[] } = {};
  const characterRefs: DocumentReference[] = [];

  if (entry.role === "dm" || entry.role === "both") {
    changes.dmId = newUid;
  }

  if (entry.role === "member" || entry.role === "both") {
    const campaignSnap = await campaignRef.get();
    const memberIds = (campaignSnap.data()?.memberIds as string[] | undefined) ?? [];
    changes.memberIds = memberIds.filter((id) => id !== oldUid).concat(newUid);

    const charactersSnap = await campaignRef
      .collection("characters")
      .where("userId", "==", oldUid)
      .limit(CHARACTERS_PER_CAMPAIGN_LIMIT + 1)
      .get();
    charactersSnap.docs.forEach((doc) => characterRefs.push(doc.ref));
  }

  batch.update(campaignRef, changes);
  characterRefs.forEach((ref) => batch.update(ref, { userId: newUid }));

  return 1 + characterRefs.length;
}
