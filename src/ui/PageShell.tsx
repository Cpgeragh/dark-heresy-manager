// src/ui/PageShell.tsx
// Standard page wrapper: vertical rhythm + centred page title. Pair with
// <Panel> for the bordered content card(s) below the title.

import type { ReactNode } from "react";
import { uiPageTitle } from "./styles/editableStyles";

export function PageShell({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-6 text-slate-200">
      <h1 className={uiPageTitle}>
        {title}
      </h1>
      {children}
    </div>
  );
}
