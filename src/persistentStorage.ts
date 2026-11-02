import { recordAccountDiagnostic } from "./accountDiagnostics";

type PersistenceApi = {
  persisted?: () => Promise<boolean>;
  persist?: () => Promise<boolean>;
};

/** Runs independently of startup: storage support or refusal must never block access. */
export async function requestPersistentStorage(storage?: PersistenceApi) {
  try {
    const manager = storage ?? (typeof navigator !== "undefined" ? navigator.storage : undefined);
    if (!manager?.persist) {
      recordAccountDiagnostic("persistent-storage", { persistence: "unsupported" });
      return;
    }
    const granted = (await manager.persisted?.()) || (await manager.persist());
    recordAccountDiagnostic("persistent-storage", {
      persistence: granted ? "granted" : "declined",
    });
  } catch {
    recordAccountDiagnostic("persistent-storage", { persistence: "error" });
  }
}
