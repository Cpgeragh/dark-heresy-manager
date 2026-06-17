// src/ui/PageShell.tsx
// Standard page wrapper: vertical rhythm + centered page title. Pair with
// <Panel> for the bordered content card(s) below the title.

import type { ReactNode } from "react";

export function PageShell({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-6 text-slate-100">
      <h1 className="text-lg font-cinzel font-bold text-slate-100 text-center">{title}</h1>
      {children}
    </div>
  );
}
