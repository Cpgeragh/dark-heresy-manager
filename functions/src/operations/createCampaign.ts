import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { runOperationTransaction, type IdempotencyExecution } from "../shared/idempotency.js";
import { resolvePrimaryUid } from "../shared/linkedIdentity.js";
import { SERVER_PRODUCT_LIMITS } from "../shared/productLimits.js";
import { enforceRateLimit } from "../shared/rateLimit.js";

export interface CreateCampaignInput {
  name: string;
  inquisitorName?: string;
  operationId: string;
}

export interface CreateCampaignResult {
  campaignId: string;
}

function validatedText(value: string, label: string, maximum: number, required: boolean): string {
  const trimmed = value.trim();
  if (required && !trimmed) {
    throw new HttpsError("invalid-argument", `${label} is required.`);
  }
  if (trimmed.length > maximum) {
    throw new HttpsError("invalid-argument", `${label} cannot be more than ${maximum} characters.`);
  }
  return trimmed;
}

export async function createCampaign(
  input: CreateCampaignInput,
  callerUid: string,
  idempotency: IdempotencyExecution<CreateCampaignResult> | null = null
): Promise<CreateCampaignResult> {
  const db = getFirestore();
  const ownerUid = await resolvePrimaryUid(db, callerUid);
  const name = validatedText(
    input.name,
    "Campaign name",
    SERVER_PRODUCT_LIMITS.campaignNameCharacters,
    true
  );
  const inquisitorName = validatedText(
    input.inquisitorName ?? "",
    "Inquisitor name",
    SERVER_PRODUCT_LIMITS.inquisitorNameCharacters,
    false
  );

  await enforceRateLimit({
    key: `create-campaign:account:${ownerUid}`,
    limit: SERVER_PRODUCT_LIMITS.campaignCreationsPerWindow,
    windowMs: SERVER_PRODUCT_LIMITS.campaignCreationWindowMs,
  });

  const campaignRef = db.collection("campaigns").doc();
  const profileRef = db.collection("userProfiles").doc(ownerUid);
  const accountCampaigns = db
    .collection("campaigns")
    .where("dmId", "==", ownerUid)
    .limit(SERVER_PRODUCT_LIMITS.campaignsPerAccount + 1);

  return runOperationTransaction(db, idempotency, async (transaction) => {
    const [profileSnapshot, campaignsSnapshot] = await Promise.all([
      transaction.get(profileRef),
      transaction.get(accountCampaigns),
    ]);
    if (campaignsSnapshot.size >= SERVER_PRODUCT_LIMITS.campaignsPerAccount) {
      throw new HttpsError(
        "resource-exhausted",
        `An account can have at most ${SERVER_PRODUCT_LIMITS.campaignsPerAccount} campaigns.`
      );
    }

    const firstName = profileSnapshot.data()?.firstName;
    const gmName =
      typeof firstName === "string"
        ? firstName.trim().slice(0, SERVER_PRODUCT_LIMITS.firstNameCharacters)
        : "";

    transaction.set(campaignRef, {
      name,
      dmId: ownerUid,
      memberIds: [],
      createdAt: FieldValue.serverTimestamp(),
      archivedAt: null,
      ...(gmName ? { gmName } : {}),
      ...(inquisitorName ? { inquisitorName } : {}),
    });
    return { campaignId: campaignRef.id };
  });
}
