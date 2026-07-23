// src/hooks/useInstallMode.ts
//
// Reads the ?invite= URL param on load and stores the result in localStorage:
//   ?invite=player → "player"   (full-app QR uses ?invite=full to switch back)
//   ?invite=full   → "full"
// Both params are authoritative and override any previously stored value, so a
// device can be switched between modes by scanning the matching QR. A plain
// load with no param keeps whatever is stored, defaulting to "full".
//
// "player" mode hides the DM section of the unified dashboard so the device
// can never be used to run campaigns.

import { useEffect, useState } from "react";

export type InstallMode = "full" | "player";

function getInitialInstallMode(): InstallMode {
  const params = new URLSearchParams(window.location.search);
  const invite = params.get("invite");
  if (invite === "player" || invite === "full") return invite;

  const stored = localStorage.getItem("installMode");
  if (stored === "player" || stored === "full") return stored;
  return "full";
}

export function useInstallMode(): InstallMode {
  const [mode] = useState<InstallMode>(getInitialInstallMode);

  useEffect(() => {
    localStorage.setItem("installMode", mode);
  }, [mode]);

  return mode;
}
