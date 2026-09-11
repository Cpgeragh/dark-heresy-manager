// src/ui/Panel.tsx
// The standard bordered content card used at page level (Dashboard, Settings,
// CampaignOverview). Defaults to space-y-6; pass className to extend.

import type { ReactNode } from "react";

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
  const spacingClass = spacing === "none" ? "" : spacing === "compact" ? "space-y-4" : "space-y-6";
  const paddingClass = padding === "none" ? "" : "p-4 lg:p-5";

  return (
    <div
      className={`border border-slate-700 bg-slate-900/40 rounded-lg ${paddingClass} ${spacingClass} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
