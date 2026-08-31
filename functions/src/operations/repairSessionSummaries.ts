import { FieldPath, getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { callerIsPrimaryOrLinked } from "../shared/linkedIdentity.js";

const MAX_SESSIONS_PER_CAMPAIGN = 200;

export interface RepairSessionSummariesInput {
  campaignId: string;
}

export interface RepairSessionSummariesResult {
  repairedCount: number;
}

function validDocumentId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 1_500 &&
    !value.includes("/")
  );
}

function validTimestamp(value: unknown): boolean {
  if (typeof value !== "object" || value === null || !("toMillis" in value)) return false;
  try {
    return Number.isFinite((value as { toMillis: () => number }).toMillis());
  } catch {
    return false;
  }
}

function safeSummaryData(data: Record<string, unknown>): Record<string, unknown> | null {
  if (!validTimestamp(data.date) || !validTimestamp(data.createdAt)) return null;
  if (typeof data.summary !== "string" || data.summary.length > 4_000) return null;
  if (
    !Number.isInteger(data.xpAwarded) ||
    (data.xpAwarded as number) < 0 ||
    (data.xpAwarded as number) > 100_000
  ) {
    return null;
  }
  if (
    !Array.isArray(data.attendees) ||
    data.attendees.length > 100 ||
    new Set(data.attendees).size !== data.attendees.length ||
    !data.attendees.every(validDocumentId)
  ) {
    return null;
  }
  if (data.xpApplied !== undefined && typeof data.xpApplied !== "boolean") return null;

  return {
    date: data.date,
    summary: data.summary,
    xpAwarded: data.xpAwarded,
    attendees: data.attendees,
    createdAt: data.createdAt,
    ...(data.xpApplied === undefined ? {} : { xpApplied: data.xpApplied }),
  };
}

/**
 * Rebuilds every member-safe session summary for one campaign. The operation
 * validates the complete source page before creating a batch, so corrupt or
 * oversized historical data cannot produce a partial migration.
 */
export async function repairSessionSummaries(
  input: RepairSessionSummariesInput,
  callerUid: string
): Promise<RepairSessionSummariesResult> {
  if (!validDocumentId(input.campaignId)) {
    throw new HttpsError("invalid-argument", "Campaign ID is invalid.");
  }

  const db = getFirestore();
  const campaignRef = db.collection("campaigns").doc(input.campaignId);
  const campaignSnapshot = await campaignRef.get();
  if (!campaignSnapshot.exists) {
    throw new HttpsError("not-found", "Campaign not found.");
  }
  const dmId = campaignSnapshot.data()?.dmId;
  if (!(await callerIsPrimaryOrLinked(db, callerUid, dmId))) {
    throw new HttpsError(
      "permission-denied",
      "Only the campaign DM can repair session summaries."
    );
  }

  const sessionsSnapshot = await campaignRef
    .collection("sessions")
    .orderBy(FieldPath.documentId())
    .limit(MAX_SESSIONS_PER_CAMPAIGN + 1)
    .get();

  if (sessionsSnapshot.docs.length > MAX_SESSIONS_PER_CAMPAIGN) {
    throw new HttpsError(
      "resource-exhausted",
      `This campaign has more than ${MAX_SESSIONS_PER_CAMPAIGN} sessions, so repair was stopped before any write.`
    );
  }

  const summaries = sessionsSnapshot.docs.map((sessionSnapshot) => {
    const data = safeSummaryData(sessionSnapshot.data());
    if (!data) {
      throw new HttpsError(
        "failed-precondition",
        `Session ${sessionSnapshot.id} contains invalid historical data, so repair was stopped before any write.`
      );
    }
    return { id: sessionSnapshot.id, data };
  });

  if (summaries.length === 0) return { repairedCount: 0 };

  const batch = db.batch();
  const summaryCollection = campaignRef.collection("sessionSummaries");
  summaries.forEach((summary) => batch.set(summaryCollection.doc(summary.id), summary.data));
  await batch.commit();

  return { repairedCount: summaries.length };
}
