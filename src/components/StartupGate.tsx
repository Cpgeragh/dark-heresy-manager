import { useEffect, useState, type ReactNode } from "react";
import { STARTUP_LOAD_TIMEOUT_MS } from "../constants/ui";
import { useCampaignsContext } from "../context/useCampaignsContext";
import { StartupStatusContext } from "../context/useStartupStatus";
import { needsRecoveryCodeBackup } from "../services/userAccountService";
import { SplashScreen } from "./SplashScreen";
import { StartupErrorModal } from "./StartupErrorModal";

interface StartupGateProps {
  ownUid: string;
  splashLabel: string;
  children: ReactNode;
}

export function StartupGate({ ownUid, splashLabel, children }: StartupGateProps) {
  const campaigns = useCampaignsContext();
  const [needsBackup, setNeedsBackup] = useState<boolean | null>(null);
  const [backupFailed, setBackupFailed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    let ignore = false;
    needsRecoveryCodeBackup(ownUid).then(
      (needed) => {
        if (!ignore) setNeedsBackup(needed);
      },
      () => {
        if (!ignore) setBackupFailed(true);
      }
    );
    return () => {
      ignore = true;
    };
  }, [ownUid]);

  const failed = Boolean(campaigns.error || campaigns.archivedError) || backupFailed;
  const ready = !failed && !campaigns.loading && !campaigns.archivedLoading && needsBackup !== null;

  useEffect(() => {
    if (ready) setOpened(true);
  }, [ready]);

  useEffect(() => {
    if (ready || failed) return;
    const timer = window.setTimeout(() => setTimedOut(true), STARTUP_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [ready, failed]);

  if (!opened && !ready) {
    if (failed || timedOut) {
      return (
        <>
          <SplashScreen label="Loading…" />
          <StartupErrorModal />
        </>
      );
    }
    return <SplashScreen label={splashLabel} />;
  }

  return (
    <StartupStatusContext.Provider value={{ needsRecoveryBackup: needsBackup ?? false }}>
      {children}
    </StartupStatusContext.Provider>
  );
}
