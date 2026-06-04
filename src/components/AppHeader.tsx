// src/components/AppHeader.tsx

import { useState } from "react";
import { Link } from "react-router-dom";
import { useHeaderExtension } from "../context/HeaderExtensionContext";

interface AppHeaderProps {
  isDM: boolean;
  currentPath: string;
  onSwitchToDM?: () => void;
  onSwitchToPlayer?: () => void;
}

export function AppHeader({
  isDM,
  currentPath,
  onSwitchToDM,
  onSwitchToPlayer,
}: AppHeaderProps) {
  const { backHref, kebabContent } = useHeaderExtension();
  const [kebabOpen, setKebabOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center relative">

        {/* Icon column — Hub link on character sheet, plain icon elsewhere */}
        {backHref ? (
          <Link
            to={backHref}
            className="shrink-0 h-8 w-8 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center hover:bg-slate-700 transition"
            aria-label="Campaign Hub"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </Link>
        ) : (
          <img
            src="/icon-192.png"
            alt="Dark Heresy Manager"
            className="h-8 w-8 rounded-lg object-cover shrink-0"
          />
        )}

        {/* App name — centred */}
        <div className="absolute inset-x-0 flex items-center justify-center gap-2 pointer-events-none">
          <img src="/icon-192.png" alt="" className="h-6 w-6 rounded-lg object-cover" />
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

            {import.meta.env.DEV && onSwitchToPlayer && onSwitchToDM && (
              <>
                <button
                  onClick={onSwitchToPlayer}
                  className="px-2 py-0.5 text-xs rounded-full bg-blue-600 text-white border border-blue-500 hover:bg-blue-500"
                >
                  Player
                </button>
                <button
                  onClick={onSwitchToDM}
                  className="px-2 py-0.5 text-xs rounded-full bg-green-600 text-white border border-green-500 hover:bg-green-500"
                >
                  DM
                </button>
              </>
            )}

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
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setKebabOpen(false)}
                    />
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
function NavLinkButton(props: {
  to: string;
  label: string;
  current?: boolean;
}) {
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
