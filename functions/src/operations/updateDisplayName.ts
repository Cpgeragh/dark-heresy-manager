import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { resolvePrimaryUid } from "../shared/linkedIdentity.js";
import { SERVER_PRODUCT_LIMITS } from "../shared/productLimits.js";

export interface UpdateDisplayNameInput {
  firstName: string;
}

function validateFirstName(value: unknown): string {
  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", "First name must be text.");
  }
  const firstName = value.trim();
  if (!firstName) {
    throw new HttpsError("invalid-argument", "First name is required.");
  }
  if (firstName.length > SERVER_PRODUCT_LIMITS.firstNameCharacters) {
    throw new HttpsError(
      "invalid-argument",
      `First name cannot exceed ${SERVER_PRODUCT_LIMITS.firstNameCharacters} characters.`
    );
  }
  return firstName;
}

/** Updates the account profile and every campaign name copy atomically. */
export async function updateDisplayName(
  input: UpdateDisplayNameInput,
  callerUid: string
): Promise<void> {
  const firstName = validateFirstName(input.firstName);
  const db = getFirestore();
  const accountId = await resolvePrimaryUid(db, callerUid);
  const profileRef = db.collection("userProfiles").doc(accountId);
  const campaignsQuery = db
    .collection("campaigns")
    .where("dmId", "==", accountId)
    .limit(SERVER_PRODUCT_LIMITS.campaignsPerAccount + 1);

  await db.runTransaction(async (transaction) => {
    const campaigns = await transaction.get(campaignsQuery);
    if (campaigns.size > SERVER_PRODUCT_LIMITS.campaignsPerAccount) {
      throw new HttpsError(
        "failed-precondition",
        "This account exceeds the campaign limit and must be repaired before its display name can be changed."
      );
    }

    transaction.set(profileRef, { firstName });
    campaigns.docs.forEach((campaign) => {
      transaction.update(campaign.ref, { gmName: firstName });
    });
  });
}
