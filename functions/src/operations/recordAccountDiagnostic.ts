import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { validateDeviceUid } from "../shared/deviceLinks.js";
import { assertRequestFields } from "../shared/validation.js";

const storageResults = [
  "missing",
  "no-database",
  "no-store",
  "unreadable",
  "timed-out",
  "invalid",
  "legacy",
  "present",
  "matching",
  "different",
];
const requestDetails = [
  "USER_NOT_FOUND",
  "USER_DISABLED",
  "EMAIL_NOT_FOUND",
  "TOKEN_EXPIRED",
  "INVALID_ID_TOKEN",
  "INVALID_REFRESH_TOKEN",
  "PROJECT_NUMBER_MISMATCH",
  "INVALID_GRANT",
  "INVALID_GRANT_TYPE",
  "MISSING_REFRESH_TOKEN",
  "INVALID_API_KEY",
  "API_KEY_INVALID",
  "API_KEY_SERVICE_BLOCKED",
  "INVALID_APP_CREDENTIAL",
  "OPERATION_NOT_ALLOWED",
  "TOO_MANY_ATTEMPTS_TRY_LATER",
  "QUOTA_EXCEEDED",
  "CONFIGURATION_NOT_FOUND",
  "APP_NOT_AUTHORIZED",
  "INTERNAL_ERROR",
  "UNAUTHENTICATED",
  "PERMISSION_DENIED",
  "UNAVAILABLE",
  "DEADLINE_EXCEEDED",
  "unrecognised-error",
  "no-users",
  "unreadable-response",
];
const sdkErrors = [
  "auth/network-request-failed",
  "auth/internal-error",
  "auth/user-disabled",
  "auth/user-not-found",
  "auth/user-token-expired",
  "auth/invalid-user-token",
  "auth/operation-not-allowed",
  "auth/too-many-requests",
  "auth/app-not-authorized",
  "auth/invalid-api-key",
  "unrecognised-error",
];

function assertDiagnosticValue(value: unknown, allowed: string[]) {
  if (typeof value !== "string" || !allowed.includes(value)) {
    throw new HttpsError("invalid-argument", "Invalid Auth diagnostic value.");
  }
}

function assertStorageEvidence(value: unknown) {
  const stores = ["indexedDb", "localStorage", "sessionStorage"];
  assertRequestFields(value, stores, stores);
  for (const store of stores) assertDiagnosticValue(value[store], storageResults);
}

function assertAuthStartup(value: unknown) {
  const required = ["startedAt", "before", "outcome", "requests"];
  assertRequestFields(value, [...required, "after", "error", "captureTimedOut"], required);
  if (
    typeof value.startedAt !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value.startedAt)
  ) {
    throw new HttpsError("invalid-argument", "Invalid Auth diagnostic timestamp.");
  }
  assertStorageEvidence(value.before);
  if ("after" in value) assertStorageEvidence(value.after);
  assertDiagnosticValue(value.outcome, ["checking", "no-login", "restored", "created", "error"]);
  if ("error" in value) assertDiagnosticValue(value.error, sdkErrors);
  if ("captureTimedOut" in value && typeof value.captureTimedOut !== "boolean") {
    throw new HttpsError("invalid-argument", "Invalid Auth diagnostic timeout.");
  }
  if (!Array.isArray(value.requests) || value.requests.length > 6) {
    throw new HttpsError("invalid-argument", "Invalid Auth diagnostic requests.");
  }
  for (const request of value.requests) {
    assertRequestFields(
      request,
      ["operation", "result", "status", "detail"],
      ["operation", "result"]
    );
    assertDiagnosticValue(request.operation, ["refresh", "lookup", "sign-up"]);
    assertDiagnosticValue(request.result, ["pending", "network-error", "http"]);
    if (request.result === "http") {
      if (
        typeof request.status !== "number" ||
        !Number.isInteger(request.status) ||
        request.status < 0 ||
        request.status > 599
      ) {
        throw new HttpsError("invalid-argument", "Invalid Auth diagnostic HTTP status.");
      }
      if ("detail" in request) assertDiagnosticValue(request.detail, requestDetails);
    } else if ("status" in request || "detail" in request) {
      throw new HttpsError("invalid-argument", "Invalid Auth diagnostic request result.");
    }
  }
}

export interface AccountDiagnosticInput {
  reportId: string;
  build: string;
  project: string;
  status: "connected" | "new-login" | "reconnect" | "startup-error";
  previousDeviceUid?: string;
  loginCreated: boolean;
  authStartup?: unknown;
}

/** Client-reported history is evidence only; it never authorises account access. */
export async function recordAccountDiagnostic(input: AccountDiagnosticInput, uid: string) {
  validateDeviceUid(uid);
  if (typeof input.loginCreated !== "boolean")
    throw new HttpsError("invalid-argument", "Invalid login diagnostic.");
  if (input.authStartup !== undefined) assertAuthStartup(input.authStartup);
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
          ...(input.authStartup === undefined ? {} : { authStartup: input.authStartup }),
        },
      ],
    });
    return { accepted: true };
  });
}
