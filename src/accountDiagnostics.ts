import type { AuthStartupEvidence } from "./authStartupDiagnostics";

type SavedAuthStartup = AuthStartupEvidence & { build: string };

type DiagnosticFields = {
  uid?: string;
  accountId?: string;
  onboarded?: boolean;
  exists?: boolean;
  fromCache?: boolean;
  persistence?: "granted" | "declined" | "unsupported" | "error";
};
const key = "dhm-account-check-v1";
const startupKey = "dhm-account-auth-startups-v1";
const build = import.meta.env.VITE_ACCOUNT_CHECK_BUILD ?? "development";
let events: object[] = [];
let startups: SavedAuthStartup[] = [];
let storageAvailable = true;
try {
  const saved: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
  if (Array.isArray(saved)) events = saved.slice(-79);
} catch {
  storageAvailable = false;
}

function readAuthStartups(): SavedAuthStartup[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(startupKey) ?? "[]");
    if (Array.isArray(saved)) {
      return saved.slice(-16).filter((startup) => typeof startup?.startedAt === "string");
    }
  } catch {
    storageAvailable = false;
  }
  return [];
}

function mergeAuthStartups(previous: SavedAuthStartup[], current: SavedAuthStartup[]) {
  const byStart = new Map(previous.map((startup) => [startup.startedAt, startup]));
  for (const startup of current) byStart.set(startup.startedAt, startup);
  return [...byStart.values()]
    .sort((left, right) => left.startedAt.localeCompare(right.startedAt))
    .slice(-16);
}

export function recordAuthStartupDiagnostic(startup: AuthStartupEvidence) {
  const snapshot = {
    ...startup,
    build,
    requests: startup.requests.map((request) => ({ ...request })),
  };
  const previous = mergeAuthStartups(startups, readAuthStartups());
  startups = mergeAuthStartups(previous, [snapshot]);
  try {
    localStorage.setItem(startupKey, JSON.stringify(startups));
  } catch {
    storageAvailable = false;
  }
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
  const authStartups = mergeAuthStartups(readAuthStartups(), startups);
  return JSON.stringify(
    {
      build,
      project: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      origin: window.location.origin,
      standalone: window.matchMedia?.("(display-mode: standalone)").matches ?? false,
      storageAvailable,
      authStartups,
      events,
    },
    null,
    2
  );
}

recordAccountDiagnostic("app-start");
