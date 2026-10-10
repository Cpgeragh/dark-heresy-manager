// src/components/AppHeader.tsx

import { useEffect, useRef, useState } from "react";
import { Link, useMatch } from "react-router-dom";
import { useHeaderExtension } from "../context/useHeaderExtension";
import { ROUTES } from "../constants/routes";
import { IconButton } from "../ui/buttons/IconButton";
import { GearIcon } from "../ui/icons/GearIcon";
import { QrCodeIcon } from "../ui/icons/QrCodeIcon";
import { QrModal } from "../ui/modals/QrModal";
import { uiIconButton, uiIconButtonIconSize } from "../ui/styles/buttonStyles";
import { AppHeaderShell } from "./AppHeaderShell";
import { colourPopoverSurface } from "../ui/styles/colourTokens";

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
            {/* Left icon: home/back */}
            {(backHref || currentPath !== ROUTES.DASHBOARD) && (
              <Link
                to={backHref ?? ROUTES.DASHBOARD}
                className={uiIconButton}
                aria-label={backHref ? "Back" : "Dashboard"}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className={uiIconButtonIconSize.md}
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
              <IconButton
                label="Share App"
                onClick={() => setShareOpen(true)}
                icon={<QrCodeIcon />}
              />
            )}
          </>
        }
        right={
          <>
            {/* Settings + kebab */}
            {/* Settings: dashboard only */}
            {isOnDashboard && (
              <IconButton label="Settings" onClick={onOpenSettings} icon={<GearIcon />} />
            )}

            {/* Kebab menu */}
            {kebabContent && (
              <div className="relative" ref={kebabRef}>
                <IconButton
                  label="Options"
                  onClick={() => setKebabOpen((v) => !v)}
                  icon={<GearIcon />}
                />

                {kebabOpen && (
                  <div
                    className={`absolute right-0 top-full mt-2 z-50 w-72 ${colourPopoverSurface} border rounded-xl shadow-2xl p-4`}
                  >
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
