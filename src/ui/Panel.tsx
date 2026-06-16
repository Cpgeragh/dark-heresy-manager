// src/ui/Panel.tsx
// The standard bordered content card used at page level (Dashboard, Settings,
// CampaignOverview). Defaults to space-y-6; pass className to extend.

import type { ReactNode } from "react";

export function Panel({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`border border-slate-700 bg-slate-900/40 p-4 rounded-lg space-y-6 ${className}`}>
      {children}
    </div>
  );
}
