// functions/src/shared/identityMigration.ts
//
// Stage 3.3: computes and applies the bulk ownership migration used by
// identity reclaim — every campaign the old identity was DM or a member of,
// and every character it owned within those campaigns, moved to the new
// identity. Mirrors src/services/identityService.ts's reclaimIdentity
// migration step exactly (same bounds, same two-phase read-then-write
// shape), factored so the reclaim operation can add its own other writes
// (identity document transfer, proof cleanup) around it in the same batch.

import type { Firestore, WriteBatch, DocumentReference } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

const CAMPAIGN_LIMIT = 50;
const CHARACTERS_PER_CAMPAIGN_LIMIT = 20;
const WRITE_LIMIT = 440;

interface CampaignMigration {
  campaignRef: DocumentReference;
  changes: { dmId?: string; memberIds?: string[] };
  characterRefs: DocumentReference[];
}

export interface OwnershipMigrationPlan {
  campaignMigrations: CampaignMigration[];
  writeCount: number;
}

function tooLargeError(): HttpsError {
  return new HttpsError(
    "resource-exhausted",
    "This account has too much data for a safe automatic migration. No ownership was changed."
  );
}

export async function computeOwnershipMigrationPlan(
  db: Firestore,
  oldUid: string,
  newUid: string
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

  const migrations = new Map<string, CampaignMigration>();

  for (const campaignDoc of dmCampaignsSnap.docs) {
    migrations.set(campaignDoc.id, {
      campaignRef: campaignDoc.ref,
      changes: { dmId: newUid },
      characterRefs: [],
    });
  }

  for (const campaignDoc of playerCampaignsSnap.docs) {
    const memberIds = (campaignDoc.data().memberIds as string[] | undefined) ?? [];
    const newMemberIds = memberIds.filter((id) => id !== oldUid).concat(newUid);

    const charactersSnap = await campaignDoc.ref
      .collection("characters")
      .where("userId", "==", oldUid)
      .limit(CHARACTERS_PER_CAMPAIGN_LIMIT + 1)
      .get();

    if (charactersSnap.docs.length > CHARACTERS_PER_CAMPAIGN_LIMIT) {
      throw tooLargeError();
    }

    const existing = migrations.get(campaignDoc.id);
    migrations.set(campaignDoc.id, {
      campaignRef: campaignDoc.ref,
      changes: { ...existing?.changes, memberIds: newMemberIds },
      characterRefs: charactersSnap.docs.map((characterDoc) => characterDoc.ref),
    });
  }

  const campaignMigrations = [...migrations.values()];
  const writeCount = campaignMigrations.reduce(
    (count, migration) => count + 1 + migration.characterRefs.length,
    0
  );

  if (writeCount > WRITE_LIMIT) {
    throw tooLargeError();
  }

  return { campaignMigrations, writeCount };
}

export function applyOwnershipMigrationPlan(
  batch: WriteBatch,
  plan: OwnershipMigrationPlan,
  newUid: string
): void {
  for (const migration of plan.campaignMigrations) {
    batch.update(migration.campaignRef, migration.changes);
    for (const characterRef of migration.characterRefs) {
      batch.update(characterRef, { userId: newUid });
    }
  }
}
