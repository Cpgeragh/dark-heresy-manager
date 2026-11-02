import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { validateDeviceUid } from "../shared/deviceLinks.js";

export interface AccountDiagnosticInput {
  reportId: string;
  build: string;
  project: string;
  status: "connected" | "new-login" | "reconnect" | "startup-error";
  previousDeviceUid?: string;
  loginCreated: boolean;
}

/** Client-reported history is evidence only; it never authorises account access. */
export async function recordAccountDiagnostic(input: AccountDiagnosticInput, uid: string) {
  validateDeviceUid(uid);
  if (typeof input.loginCreated !== "boolean")
    throw new HttpsError("invalid-argument", "Invalid login diagnostic.");
  if (
    !/^[a-zA-Z0-9-]{16,64}$/.test(input.reportId) ||
    !/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(input.build)
  ) {
    throw new HttpsError("invalid-argument", "Invalid diagnostic report.");
  }
  if (!["connected", "new-login", "reconnect", "startup-error"].includes(input.status)) {
    throw new HttpsError("invalid-argument", "Invalid diagnostic status.");
  }
  if (
    input.previousDeviceUid !== undefined &&
    !/^[a-zA-Z0-9]{20,128}$/.test(input.previousDeviceUid)
  )
    throw new HttpsError("invalid-argument", "Invalid previous device ID.");
  const db = getFirestore();
  const project = process.env.GCLOUD_PROJECT;
  if (input.project !== project)
    throw new HttpsError("invalid-argument", "Diagnostic project mismatch.");
  const now = Date.now();
  const day = new Date(now).toISOString().slice(0, 10);
  const ref = db.collection("accountDiagnostics").doc(`${uid}_${day}`);
  return db.runTransaction(async (tx) => {
    const existing = await tx.get(ref);
    const reports = existing.data()?.reports ?? [];
    if (reports.some((report: { reportId: string }) => report.reportId === input.reportId))
      return { accepted: true };
    if (reports.length >= 4) return { accepted: false };
    const link = await tx.get(db.collection("userLinks").doc(uid));
    const accountId = link.data()?.primaryUid;
    tx.set(ref, {
      uid,
      project,
      expiresAt: existing.data()?.expiresAt ?? Timestamp.fromMillis(now + 14 * 24 * 60 * 60 * 1000),
      reports: [
        ...reports,
        {
          reportId: input.reportId,
          build: input.build,
          status: input.status,
          loginCreated: input.loginCreated,
          receivedAt: Timestamp.fromMillis(now),
          accountId: typeof accountId === "string" ? accountId : null,
          clientReportedPreviousDeviceUid: input.previousDeviceUid ?? null,
        },
      ],
    });
    return { accepted: true };
  });
}
