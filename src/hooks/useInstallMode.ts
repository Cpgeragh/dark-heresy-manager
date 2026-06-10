// src/hooks/useInstallMode.ts
//
// Reads the ?invite=player URL param on first load and permanently stores
// "player" in localStorage. All subsequent loads (even without the param)
// return "player". Without the param, defaults to "full".
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
    if (params.get("invite") === "player") {
      localStorage.setItem("installMode", "player");
      setMode("player");
    } else if (!localStorage.getItem("installMode")) {
      localStorage.setItem("installMode", "full");
      setMode("full");
    }
  }, []);

  return mode;
}
