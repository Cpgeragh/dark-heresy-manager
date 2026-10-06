import { createContext, useContext } from "react";

export interface StartupStatus {
  needsRecoveryBackup: boolean;
}

export const StartupStatusContext = createContext<StartupStatus>({ needsRecoveryBackup: false });

export function useStartupStatus() {
  return useContext(StartupStatusContext);
}
