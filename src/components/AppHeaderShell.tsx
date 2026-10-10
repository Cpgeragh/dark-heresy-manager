import type { ReactNode } from "react";

interface AppHeaderShellProps {
  left?: ReactNode;
  right?: ReactNode;
}

export function AppHeaderShell({ left, right }: AppHeaderShellProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-4 py-2 lg:px-6">
        <div className="flex items-center gap-2">{left}</div>

        <div className="pointer-events-none flex items-center justify-center">
          <span className="font-cinzel text-base font-bold tracking-wide text-slate-200">
            Dark Heresy Manager
          </span>
        </div>

        <div className="flex items-center justify-end gap-2">{right}</div>
      </div>
    </header>
  );
}
