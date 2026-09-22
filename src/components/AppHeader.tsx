// src/components/AppHeader.tsx

import { useEffect, useRef, useState } from "react";
import { Link, useMatch } from "react-router-dom";
import { useHeaderExtension } from "../context/useHeaderExtension";
import { ROUTES } from "../constants/routes";
import { GearIcon } from "../ui/icons/GearIcon";
import { QrCodeIcon } from "../ui/icons/QrCodeIcon";
import { QrModal } from "../ui/modals/QrModal";
import { uiIconButton } from "../ui/styles/buttonStyles";
import { AppHeaderShell, appHeaderIconButtonClass } from "./AppHeaderShell";

interface AppHeaderProps {
  currentPath: string;
  onOpenSettings: () => void;
}

export function AppHeader({ currentPath, onOpenSettings }: AppHeaderProps) {
  const { backHref, kebabContent } = useHeaderExtension();
  const [kebabOpen, setKebabOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const kebabRef = useRef<HTMLDivElement>(null);
  const isOnDashboard = !!useMatch(ROUTES.DASHBOARD);

  useEffect(() => {
    if (!kebabOpen) return;

    function closeFromOutside(event: PointerEvent) {
      if (!kebabRef.current?.contains(event.target as Node)) {
        setKebabOpen(false);
      }
    }

    function closeFromEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setKebabOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeFromOutside);
    document.addEventListener("keydown", closeFromEscape);
    return () => {
      document.removeEventListener("pointerdown", closeFromOutside);
      document.removeEventListener("keydown", closeFromEscape);
    };
  }, [kebabOpen]);

  return (
    <>
      <AppHeaderShell
        left={
          <>
            {/* Left icon — home/back */}
            {(backHref || currentPath !== ROUTES.DASHBOARD) && (
              <Link
                to={backHref ?? ROUTES.DASHBOARD}
                className={appHeaderIconButtonClass}
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
            {isOnDashboard && (
              <button
                type="button"
                onClick={() => setShareOpen(true)}
                aria-label="Share App"
                className={uiIconButton}
              >
                <QrCodeIcon />
              </button>
            )}
          </>
        }
        right={
          <>
            {/* Settings + kebab */}
            {/* Settings — dashboard only */}
            {isOnDashboard && (
              <button
                type="button"
                onClick={onOpenSettings}
                aria-label="Settings"
                className={uiIconButton}
              >
                <GearIcon />
              </button>
            )}

            {/* Kebab menu */}
            {kebabContent && (
              <div className="relative" ref={kebabRef}>
                <button
                  type="button"
                  onClick={() => setKebabOpen((v) => !v)}
                  aria-label="Options"
                  className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-300 text-base leading-none"
                >
                  ⋮
                </button>

                {kebabOpen && (
                  <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4">
                    {kebabContent}
                  </div>
                )}
              </div>
            )}
          </>
        }
      />
      {shareOpen && (
        <QrModal
          title="Share App"
          url={window.location.origin}
          onClose={() => setShareOpen(false)}
        />
      )}
    </>
  );
}
