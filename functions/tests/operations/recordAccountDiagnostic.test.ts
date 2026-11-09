import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { recordAccountDiagnostic } from "../../src/operations/recordAccountDiagnostic";

const { set, runTransaction } = vi.hoisted(() => ({ set: vi.fn(), runTransaction: vi.fn() }));
vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({
    collection: (name: string) => ({ doc: (id: string) => `${name}/${id}` }),
    runTransaction,
  }),
  Timestamp: { fromMillis: (milliseconds: number) => milliseconds },
}));

const uid = "diagnosticDevice123456789";
const missing = { indexedDb: "no-database", localStorage: "missing", sessionStorage: "missing" };
const authStartup = {
  startedAt: "2026-11-09T00:38:33.069Z",
  before: missing,
  after: { ...missing, indexedDb: "matching" },
  outcome: "created",
  requests: [{ operation: "sign-up", result: "http", status: 200 }],
};
const report = {
  reportId: "diagnostic-report-12345678",
  build: "2026-11-09T00:00:00.000Z",
  project: "dh-test",
  status: "reconnect" as const,
  loginCreated: true,
};

beforeEach(() => {
  vi.stubEnv("GCLOUD_PROJECT", "dh-test");
  set.mockReset();
  runTransaction
    .mockReset()
    .mockImplementation((callback) =>
      callback({ set, get: async () => ({ data: () => ({ primaryUid: "account-from-server" }) }) })
    );
});

afterEach(() => vi.unstubAllEnvs());

it("keeps the startup snapshot alongside the server's verified device and account", async () => {
  await expect(recordAccountDiagnostic({ ...report, authStartup }, uid)).resolves.toEqual({
    accepted: true,
  });
  expect(set).toHaveBeenCalledWith(
    expect.stringMatching(/^accountDiagnostics\//),
    expect.objectContaining({
      uid,
      reports: [expect.objectContaining({ authStartup, accountId: "account-from-server" })],
    })
  );
});

it("still accepts reports from older app builds without a startup snapshot", async () => {
  await expect(recordAccountDiagnostic(report, uid)).resolves.toEqual({ accepted: true });
  expect(set.mock.calls[0][1].reports[0]).not.toHaveProperty("authStartup");
});

it.each([
  { ...authStartup, before: { ...missing, refreshToken: "private" } },
  {
    ...authStartup,
    requests: [{ operation: "lookup", result: "http", status: 400, detail: "private" }],
  },
  { ...authStartup, requests: [{ operation: "lookup", result: "network-error", status: 400 }] },
])("rejects invalid or private data inside the nested evidence", async (value) => {
  await expect(
    recordAccountDiagnostic({ ...report, authStartup: value }, uid)
  ).rejects.toMatchObject({
    code: "invalid-argument",
  });
  expect(runTransaction).not.toHaveBeenCalled();
});
