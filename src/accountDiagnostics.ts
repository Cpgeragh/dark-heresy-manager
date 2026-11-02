type DiagnosticFields = {
  uid?: string;
  accountId?: string;
  onboarded?: boolean;
  exists?: boolean;
  fromCache?: boolean;
  persistence?: "granted" | "declined" | "unsupported" | "error";
};
const key = "dhm-account-check-v1";
const build = import.meta.env.VITE_ACCOUNT_CHECK_BUILD ?? "development";
let events: object[] = [];
let storageAvailable = true;
try {
  const saved: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
  if (Array.isArray(saved)) events = saved.slice(-79);
} catch {
  storageAvailable = false;
}

// Only explicit diagnostic fields are accepted. Never pass Firebase User objects,
// error messages, recovery codes or credentials into this log.
export function recordAccountDiagnostic(event: string, fields: DiagnosticFields = {}) {
  const { uid, accountId, onboarded, exists, fromCache, persistence } = fields;
  events.push({
    at: new Date().toISOString(),
    build,
    event,
    uid,
    accountId,
    onboarded,
    exists,
    fromCache,
    persistence,
  });
  events = events.slice(-80);
  try {
    localStorage.setItem(key, JSON.stringify(events));
  } catch {
    storageAvailable = false;
  }
}

export function exportAccountDiagnostics() {
  return JSON.stringify(
    {
      build,
      project: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      origin: window.location.origin,
      standalone: window.matchMedia?.("(display-mode: standalone)").matches ?? false,
      storageAvailable,
      events,
    },
    null,
    2
  );
}

recordAccountDiagnostic("app-start");
