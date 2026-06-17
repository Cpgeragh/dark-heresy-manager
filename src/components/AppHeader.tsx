// src/components/AppHeader.tsx

import { useState } from "react";
import { Link, useMatch } from "react-router-dom";
import { useHeaderExtension } from "../context/HeaderExtensionContext";
import { ROUTES, ROUTE_PATTERNS } from "../constants/routes";

interface AppHeaderProps {
  currentPath: string;
  onOpenMessages?: () => void;
}

export function AppHeader({ currentPath, onOpenMessages }: AppHeaderProps) {
  const { backHref, kebabContent } = useHeaderExtension();
  const [kebabOpen, setKebabOpen] = useState(false);
  const isOnCharacterSheet = !!useMatch(ROUTE_PATTERNS.CHARACTER_SHEET);
  const isOnDashboard = !!useMatch(ROUTES.DASHBOARD);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-2 grid grid-cols-[1fr_auto_1fr] items-center">
        {/* Left icons — home/back + messages */}
        <div className="flex items-center gap-2">
          {(backHref || currentPath !== ROUTES.DASHBOARD) && (
            <Link
              to={backHref ?? ROUTES.DASHBOARD}
              className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center hover:bg-slate-700 transition"
              aria-label={backHref ? "Back" : "Dashboard"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 text-slate-300"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                />
              </svg>
            </Link>
          )}

          {onOpenMessages && isOnCharacterSheet && (
            <button
              onClick={onOpenMessages}
              aria-label="Messages"
              className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center hover:bg-slate-700 transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 text-slate-300"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                />
              </svg>
            </button>
          )}
        </div>

        {/* App name — centred */}
        <div className="flex items-center justify-center pointer-events-none">
          <span className="font-cinzel font-bold text-slate-200 text-base tracking-wide">Dark Heresy Manager</span>
        </div>

        {/* Settings + kebab */}
        <div className="flex items-center justify-end gap-2">
          {/* Settings — dashboard only */}
          {isOnDashboard && (
            <Link
              to={ROUTES.SETTINGS}
              aria-label="Settings"
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
              </svg>
            </Link>
          )}

          {/* Kebab menu */}
          {kebabContent && (
            <div className="relative">
              <button
                onClick={() => setKebabOpen((v) => !v)}
                aria-label="Options"
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-300 text-base leading-none"
              >
                ⋮
              </button>

              {kebabOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setKebabOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4">
                    {kebabContent}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
