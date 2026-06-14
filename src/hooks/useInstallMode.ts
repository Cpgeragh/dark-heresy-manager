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

export function useInstallMode(): InstallMode {
  const [mode, setMode] = useState<InstallMode>(() => {
    const stored = localStorage.getItem("installMode");
    if (stored === "player" || stored === "full") return stored;
    return "full"; // default until useEffect runs
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get("invite");
    if (invite === "player") {
      localStorage.setItem("installMode", "player");
      setMode("player");
    } else if (invite === "full") {
      localStorage.setItem("installMode", "full");
      setMode("full");
    } else if (!localStorage.getItem("installMode")) {
      localStorage.setItem("installMode", "full");
      setMode("full");
    }
  }, []);

  return mode;
}
