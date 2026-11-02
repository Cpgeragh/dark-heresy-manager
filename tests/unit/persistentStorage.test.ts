import { beforeEach, expect, it, vi } from "vitest";
const record = vi.hoisted(() => vi.fn());
vi.mock("../../src/accountDiagnostics", () => ({ recordAccountDiagnostic: record }));
import { requestPersistentStorage } from "../../src/persistentStorage";

beforeEach(() => vi.clearAllMocks());

it("requests persistence and records the browser's decision", async () => {
  const persist = vi.fn().mockResolvedValue(true);
  await requestPersistentStorage({ persisted: async () => false, persist });
  expect(persist).toHaveBeenCalledOnce();
  expect(record).toHaveBeenLastCalledWith("persistent-storage", { persistence: "granted" });
});

it("does not request again when storage is already persistent", async () => {
  const persist = vi.fn();
  await requestPersistentStorage({ persisted: async () => true, persist });
  expect(persist).not.toHaveBeenCalled();
  expect(record).toHaveBeenLastCalledWith("persistent-storage", { persistence: "granted" });
});

it("accepts refusal without interrupting the app", async () => {
  await requestPersistentStorage({ persist: async () => false });
  expect(record).toHaveBeenLastCalledWith("persistent-storage", { persistence: "declined" });
});

it("handles unsupported browsers and rejected storage requests", async () => {
  await requestPersistentStorage({});
  expect(record).toHaveBeenLastCalledWith("persistent-storage", { persistence: "unsupported" });
  await requestPersistentStorage({
    persist: async () => {
      throw new Error("blocked");
    },
  });
  expect(record).toHaveBeenLastCalledWith("persistent-storage", { persistence: "error" });
});
