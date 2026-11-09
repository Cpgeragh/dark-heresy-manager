import { recordAuthStartupDiagnostic } from "./accountDiagnostics";
import { readAccountConnection } from "./services/accountConnectionMarker";

type StorageResult =
  | "missing"
  | "no-database"
  | "no-store"
  | "unreadable"
  | "timed-out"
  | "invalid"
  | "legacy"
  | "present"
  | "matching"
  | "different";
type StorageEvidence = Record<"indexedDb" | "localStorage" | "sessionStorage", StorageResult>;
type AuthRequest = {
  operation: "refresh" | "lookup" | "sign-up";
  result: "pending" | "network-error" | "http";
  status?: number;
  detail?: string;
};
type Outcome = "checking" | "no-login" | "restored" | "created" | "error";

export interface AuthStartupEvidence {
  startedAt: string;
  before: StorageEvidence;
  after?: StorageEvidence;
  requests: AuthRequest[];
  outcome: Outcome;
  error?: string;
  captureTimedOut?: boolean;
}

const storageTimeout = 250;
// The current Auth SDK can wait 60 seconds per request on mobile.
const captureTimeout = 195_000;
const databaseName = "firebaseLocalStorageDb";
const storeName = "firebaseLocalStorage";
const serverErrors = new Set([
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
]);
const sdkErrors = new Set([
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
]);

let evidence: AuthStartupEvidence | undefined;
let storageKey = "";
let stopCapture: (() => void) | undefined;
let completeReport: (() => void) | undefined;
let reportReady: Promise<void> | undefined;
let finishing = false;
let startupUid: string | undefined;
const responseDetails: Promise<void>[] = [];

function classify(value: unknown, expectedUid?: string): StorageResult {
  if (typeof value === "string" && value) return "legacy";
  if (typeof value !== "object" || value === null) return "invalid";
  const { uid, stsTokenManager, isAnonymous, emailVerified } = value as Record<string, unknown>;
  if (
    typeof uid !== "string" ||
    !uid ||
    !stsTokenManager ||
    typeof stsTokenManager !== "object" ||
    typeof isAnonymous !== "boolean" ||
    typeof emailVerified !== "boolean"
  )
    return "invalid";
  if (!expectedUid) return "present";
  return uid === expectedUid ? "matching" : "different";
}

function readWebStorage(
  storage: "localStorage" | "sessionStorage",
  expectedUid?: string
): StorageResult {
  try {
    const raw = window[storage].getItem(storageKey);
    if (raw === null) return "missing";
    try {
      return classify(JSON.parse(raw), expectedUid);
    } catch {
      return "invalid";
    }
  } catch {
    return "unreadable";
  }
}

function readIndexedDb(expectedUid?: string): Promise<StorageResult> {
  return new Promise((resolve) => {
    let finished = false;
    let database: IDBDatabase | undefined;
    const finish = (result: StorageResult) => {
      finished = true;
      window.clearTimeout(timer);
      database?.close();
      resolve(result);
    };
    const timer = window.setTimeout(() => finish("timed-out"), storageTimeout);
    try {
      const request = window.indexedDB.open(databaseName);
      request.onupgradeneeded = () => {
        // An open on a missing database starts a creation transaction. Abort it.
        request.transaction?.abort();
        finish("no-database");
      };
      request.onerror = () => finish("unreadable");
      request.onsuccess = () => {
        database = request.result;
        if (finished) {
          database.close();
          return;
        }
        try {
          if (!database.objectStoreNames.contains(storeName)) {
            finish("no-store");
            return;
          }
          const read = database
            .transaction(storeName, "readonly")
            .objectStore(storeName)
            .get(storageKey);
          read.onsuccess = () =>
            finish(
              read.result === undefined ? "missing" : classify(read.result.value, expectedUid)
            );
          read.onerror = () => finish("unreadable");
        } catch {
          finish("unreadable");
        }
      };
    } catch {
      finish("unreadable");
    }
  });
}

async function readStorage(expectedUid?: string): Promise<StorageEvidence> {
  const localStorage = readWebStorage("localStorage", expectedUid);
  const sessionStorage = readWebStorage("sessionStorage", expectedUid);
  const indexedDb = await readIndexedDb(expectedUid);
  return { indexedDb, localStorage, sessionStorage };
}

function identifyRequest(
  input: RequestInfo | URL,
  apiKey: string
): AuthRequest["operation"] | undefined {
  try {
    const url = new URL(input instanceof Request ? input.url : input);
    if (url.protocol !== "https:" || url.searchParams.get("key") !== apiKey) return;
    if (url.host === "securetoken.googleapis.com" && url.pathname === "/v1/token") return "refresh";
    if (url.host !== "identitytoolkit.googleapis.com") return;
    if (url.pathname === "/v1/accounts:lookup") return "lookup";
    if (url.pathname === "/v1/accounts:signUp") return "sign-up";
  } catch {
    // Other requests can use relative URLs.
  }
}

async function readResponseDetail(request: AuthRequest, response: Response) {
  try {
    const body = await response.clone().json();
    const message = body?.error?.message ?? body?.errorMessage;
    if (!response.ok || typeof message === "string") {
      const code = typeof message === "string" ? message.split(" : ", 1)[0] : "";
      request.detail = serverErrors.has(code) ? code : "unrecognised-error";
    } else if (!Array.isArray(body?.users) || !body.users.length) {
      request.detail = "no-users";
    }
  } catch {
    request.detail = "unreadable-response";
  }
}

function captureRequests(startup: AuthStartupEvidence, apiKey: string) {
  const original = window.fetch;
  const observed: typeof fetch = (input, init) => {
    const operation = identifyRequest(input, apiKey);
    if (!operation || startup.requests.length >= 6) return original.call(window, input, init);
    const request: AuthRequest = { operation, result: "pending" };
    startup.requests.push(request);
    recordAuthStartupDiagnostic(startup);
    return original.call(window, input, init).then(
      (response) => {
        request.result = "http";
        request.status = response.status;
        recordAuthStartupDiagnostic(startup);
        if (!response.ok || operation === "lookup") {
          responseDetails.push(
            readResponseDetail(request, response).then(() => {
              if (request.detail) recordAuthStartupDiagnostic(startup);
            })
          );
        }
        return response;
      },
      (error: unknown) => {
        request.result = "network-error";
        recordAuthStartupDiagnostic(startup);
        throw error;
      }
    );
  };
  window.fetch = observed;
  const timer = window.setTimeout(() => {
    stop();
    startup.captureTimedOut = true;
    recordAuthStartupDiagnostic(startup);
    completeReport?.();
  }, captureTimeout);
  const stop = () => {
    window.clearTimeout(timer);
    if (window.fetch === observed) window.fetch = original;
  };
  return stop;
}

export async function beginAuthStartupDiagnostics(apiKey: string, appName: string) {
  const startedAt = new Date().toISOString();
  storageKey = `firebase:authUser:${apiKey}:${appName}`;
  const before = await readStorage(readAccountConnection()?.deviceUid);
  evidence = { startedAt, before, requests: [], outcome: "checking" };
  recordAuthStartupDiagnostic(evidence);
  stopCapture = captureRequests(evidence, apiKey);
  reportReady = new Promise((resolve) => {
    completeReport = resolve;
  });
}

export function noteAuthStartupWithoutLogin() {
  if (evidence?.outcome !== "checking") return;
  evidence.outcome = "no-login";
  recordAuthStartupDiagnostic(evidence);
}

export function finishAuthStartup(
  outcome: "restored" | "created" | "error",
  uid?: string,
  cause?: unknown
) {
  const startup = evidence;
  if (!startup || finishing) return;
  finishing = true;
  startupUid = uid;
  startup.outcome = outcome;
  if (outcome === "error") {
    const code =
      typeof cause === "object" && cause !== null && "code" in cause ? cause.code : undefined;
    startup.error = typeof code === "string" && sdkErrors.has(code) ? code : "unrecognised-error";
  }
  stopCapture?.();
  recordAuthStartupDiagnostic(startup);
  void (async () => {
    // A failed request's body can still be decoding when Auth reports its result.
    const details = new Promise<void>((resolve) => {
      const timer = window.setTimeout(resolve, storageTimeout);
      void Promise.all(responseDetails).then(() => {
        window.clearTimeout(timer);
        resolve();
      });
    });
    const [after] = await Promise.all([uid ? readStorage(uid) : undefined, details]);
    if (after) startup.after = after;
    recordAuthStartupDiagnostic(startup);
  })().then(completeReport, completeReport);
}

export function authStartupEvidenceForReport(uid?: string) {
  return reportReady?.then(() => {
    if (!evidence || (uid && uid !== startupUid)) return undefined;
    return { ...evidence, requests: evidence.requests.map((request) => ({ ...request })) };
  });
}
