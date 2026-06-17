// src/ui/PageShell.tsx
// Standard page wrapper: vertical rhythm + centered page title. Pair with
// <Panel> for the bordered content card(s) below the title.

import type { ReactNode } from "react";

export function PageShell({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-6 text-slate-200">
      <h1 className="text-lg lg:text-xl font-cinzel font-bold text-slate-200 text-center">{title}</h1>
      {children}
    </div>
  );
}
