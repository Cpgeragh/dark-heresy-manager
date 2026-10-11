// src/components/AppHeader.tsx

import { useEffect, useRef, useState } from "react";
import { Link, useMatch } from "react-router-dom";
import { useHeaderExtension } from "../context/useHeaderExtension";
import { ROUTES } from "../constants/routes";
import { IconButton } from "../ui/buttons/IconButton";
import { GearIcon } from "../ui/icons/GearIcon";
import { HomeIcon } from "../ui/icons/HomeIcon";
import { QrCodeIcon } from "../ui/icons/QrCodeIcon";
import { QrModal } from "../ui/modals/QrModal";
import { uiIconButton, uiIconButtonIconSize, uiPressFeedback } from "../ui/styles/buttonStyles";
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
                className={`${uiIconButton} ${uiPressFeedback()}`}
                aria-label={backHref ? "Back" : "Dashboard"}
              >
                <HomeIcon className={uiIconButtonIconSize.md} />
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
