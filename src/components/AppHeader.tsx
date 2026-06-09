// src/components/AppHeader.tsx

import { useState } from "react";
import { Link } from "react-router-dom";
import { useHeaderExtension } from "../context/HeaderExtensionContext";
import { ROUTES } from "../constants/routes";

interface AppHeaderProps {
  isDM: boolean;
  currentPath: string;
}

export function AppHeader({ isDM, currentPath }: AppHeaderProps) {
  const { backHref, kebabContent } = useHeaderExtension();
  const [kebabOpen, setKebabOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center relative">
        {/* Icon column — back/home button everywhere except the dashboard */}
        {(backHref || currentPath !== (isDM ? ROUTES.DM_DASHBOARD : ROUTES.PLAYER_DASHBOARD)) && (
          <Link
            to={backHref ?? (isDM ? ROUTES.DM_DASHBOARD : ROUTES.PLAYER_DASHBOARD)}
            className="shrink-0 h-8 w-8 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center hover:bg-slate-700 transition"
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

        {/* App name — centred */}
        <div className="absolute inset-x-0 flex items-center justify-center gap-2 pointer-events-none">
          <img src="/icon-192.png" alt="" className="h-7 w-7 rounded-lg object-cover" />
          <span className={`font-semibold text-slate-100 ${backHref ? "text-base" : "text-sm"}`}>
            Dark Heresy Manager
          </span>
        </div>

        {/* Nav + kebab */}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {isDM && (
            <NavLinkButton
              to="/select"
              label="Select Campaign"
              current={currentPath === "/select"}
            />
          )}

          {/* Settings */}
          <Link
            to={ROUTES.SETTINGS}
            aria-label="Settings"
            className="w-7 h-7 flex items-center justify-center rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </Link>

          {/* Kebab menu */}
          {kebabContent && (
            <div className="relative">
              <button
                onClick={() => setKebabOpen((v) => !v)}
                aria-label="Options"
                className="w-7 h-7 flex items-center justify-center rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-300 text-base leading-none"
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

// -------------------------------------------------
// NAV LINK BUTTON
// -------------------------------------------------
function NavLinkButton(props: { to: string; label: string; current?: boolean }) {
  return (
    <Link
      to={props.to}
      className={`px-3 py-1 rounded-full text-sm border transition
        ${
          props.current
            ? "bg-amber-500 text-slate-900 border-amber-400 shadow"
            : "border-slate-600 text-slate-200 hover:bg-slate-800"
        }`}
    >
      {props.label}
    </Link>
  );
}
