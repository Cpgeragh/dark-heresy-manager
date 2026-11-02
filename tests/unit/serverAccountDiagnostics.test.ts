// @vitest-environment jsdom
import { beforeEach, afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  call: vi.fn(),
  auth: { currentUser: { uid: "device-1" } as { uid: string } | null },
}));
vi.mock("../../src/firebase", () => ({ auth: mocks.auth, functions: {} }));
vi.mock("firebase/functions", () => ({ httpsCallable: () => mocks.call }));
beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  vi.stubEnv("PROD", true);
  vi.stubEnv("VITE_ACCOUNT_CHECK_BUILD", "2026-11-02T12:00:00.000Z");
  vi.stubEnv("VITE_FIREBASE_PROJECT_ID", "dh-test");
  mocks.auth.currentUser = { uid: "device-1" };
  mocks.call.mockReset().mockResolvedValue({ data: { accepted: true } });
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

it("queues offline reports, uploads on reconnection and deduplicates a session status", async () => {
  const service = await import("../../src/services/serverAccountDiagnostics");
  service.noteCreatedDiagnosticLogin("device-1");
  service.queueAccountDiagnostic("device-1", "new-login");
  service.queueAccountDiagnostic("device-1", "new-login");
  expect(mocks.call).not.toHaveBeenCalled();
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
  await service.flushAccountDiagnostics("device-1");
  expect(mocks.call).toHaveBeenCalledOnce();
  expect(mocks.call.mock.calls[0][0]).toMatchObject({
    status: "new-login",
    loginCreated: true,
    project: "dh-test",
  });
  expect(Object.keys(mocks.call.mock.calls[0][0]).sort()).toEqual([
    "build",
    "loginCreated",
    "project",
    "reportId",
    "status",
  ]);
});

it("never uploads an old login's report using a new login", async () => {
  const service = await import("../../src/services/serverAccountDiagnostics");
  service.queueAccountDiagnostic("device-1", "connected");
  mocks.auth.currentUser = { uid: "replacement" };
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
  await service.flushAccountDiagnostics("device-1");
  expect(mocks.call).not.toHaveBeenCalled();
});

it("keeps a failed report for retry and enforces a daily attempt cap", async () => {
  const service = await import("../../src/services/serverAccountDiagnostics");
  service.queueAccountDiagnostic("device-1", "startup-error");
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
  mocks.call.mockRejectedValue(new Error("offline"));
  for (let i = 0; i < 8; i++) await service.flushAccountDiagnostics("device-1");
  expect(mocks.call).toHaveBeenCalledTimes(4);
  expect(
    JSON.parse(localStorage.getItem("dhm-server-diagnostic-v1:device-1")!).reports
  ).toHaveLength(1);
});
