import { readAccountConnection } from "./accountConnectionMarker";

export type AccountDiagnosticStatus = "connected" | "new-login" | "reconnect" | "startup-error";
interface Report {
  reportId: string;
  build: string;
  project: string;
  status: AccountDiagnosticStatus;
  previousDeviceUid?: string;
  loginCreated: boolean;
}
interface Queue {
  day: string;
  attempts: number;
  reports: Report[];
}
const memory = new Map<string, Queue>();
const seen = new Set<string>();
const running = new Set<string>();
const prefix = "dhm-server-diagnostic-v1:";
const createdLogins = new Set<string>();
export function noteCreatedDiagnosticLogin(uid: string) {
  createdLogins.add(uid);
}

function queueFor(uid: string): Queue {
  let state = memory.get(uid);
  if (!state) {
    try {
      const saved = JSON.parse(localStorage.getItem(prefix + uid) ?? "null");
      if (
        saved &&
        typeof saved.day === "string" &&
        Number.isInteger(saved.attempts) &&
        saved.attempts >= 0 &&
        Array.isArray(saved.reports)
      )
        state = { ...saved, reports: saved.reports.slice(-4) };
    } catch {
      /* Local storage is optional. */
    }
  }
  const day = new Date().toISOString().slice(0, 10);
  if (!state) state = { day, attempts: 0, reports: [] };
  if (state.day !== day) {
    state.day = day;
    state.attempts = 0;
  }
  memory.set(uid, state);
  return state;
}
function save(uid: string, state: Queue) {
  try {
    localStorage.setItem(prefix + uid, JSON.stringify(state));
  } catch {
    /* Retain the in-memory copy. */
  }
}

export async function flushAccountDiagnostics(uid: string) {
  if (running.has(uid) || navigator.onLine === false) return;
  running.add(uid);
  try {
    const state = queueFor(uid);
    if (!state.reports.length || state.attempts >= 4) return;
    const [{ auth, functions }, { httpsCallable }] = await Promise.all([
      import("../firebase"),
      import("firebase/functions"),
    ]);
    // Never attribute an old login's queued reports to a newly created login.
    if (auth.currentUser?.uid !== uid) return;
    const call = httpsCallable<Report, { accepted: boolean }>(
      functions,
      "recordAccountDiagnostic",
      { timeout: 15_000 }
    );
    while (state.reports.length && state.attempts < 4) {
      if (auth.currentUser?.uid !== uid) break;
      state.attempts++;
      save(uid, state);
      await call(state.reports[0]);
      state.reports.shift();
      save(uid, state);
    }
  } catch {
    /* Reporting must never block account access; retry on a later connection. */
  } finally {
    running.delete(uid);
  }
}

export function queueAccountDiagnostic(uid: string, status: AccountDiagnosticStatus) {
  if (!import.meta.env.PROD || import.meta.env.MODE === "performance") return;
  try {
    const sessionKey = `${uid}:${status}`;
    if (seen.has(sessionKey)) return;
    seen.add(sessionKey);
    const state = queueFor(uid);
    const previous = readAccountConnection()?.deviceUid;
    state.reports.push({
      reportId: crypto.randomUUID(),
      build: import.meta.env.VITE_ACCOUNT_CHECK_BUILD,
      project: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      status,
      loginCreated: createdLogins.has(uid),
      ...(previous && /^[a-zA-Z0-9]{20,128}$/.test(previous)
        ? { previousDeviceUid: previous }
        : {}),
    });
    state.reports = state.reports.slice(-4);
    save(uid, state);
    void flushAccountDiagnostics(uid);
  } catch {
    // Diagnostic storage or browser API failures must not interrupt the app.
  }
}
