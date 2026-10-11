// src/ui/Panel.tsx
// The standard bordered content card used at page level (Dashboard, Settings,
// CampaignOverview). Defaults to the page stack; pass className to extend.

import type { ReactNode } from "react";
import { uiSectionShell, uiStackBody, uiStackPage } from "./styles/editableStyles";

export function Panel({
  className = "",
  spacing = "default",
  padding = "default",
  children,
}: {
  className?: string;
  spacing?: "default" | "compact" | "none";
  padding?: "default" | "none";
  children: ReactNode;
}) {
  const spacingClass = spacing === "none" ? "" : spacing === "compact" ? uiStackBody : uiStackPage;
  const paddingClass = padding === "none" ? "" : "p-3 lg:p-4";

  return (
    <div className={`${uiSectionShell} ${paddingClass} ${spacingClass} ${className}`.trim()}>
      {children}
    </div>
  );
}
