// src/components/AppHeader.tsx

import { Link } from "react-router-dom";

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
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
      <nav
        className="
          max-w-5xl mx-auto px-4 py-3
          flex flex-col gap-3
          sm:flex-row sm:items-center sm:justify-between
        "
      >
        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-slate-900 font-bold">
            DH
          </span>
          <div>
            <div className="font-semibold">Dark Heresy Manager</div>
            <div className="text-xs text-slate-400">
              {isDM ? "DM View" : "Player View"}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          {isDM ? (
            <>
              <NavLinkButton
                to="/dm"
                label="DM Dashboard"
                current={currentPath === "/dm"}
              />
              <NavLinkButton
                to="/select"
                label="Select Campaign"
                current={currentPath === "/select"}
              />
            </>
          ) : (
            <NavLinkButton
              to="/player"
              label="Dashboard"
              current={currentPath === "/player"}
            />
          )}

          {import.meta.env.DEV && onSwitchToPlayer && onSwitchToDM && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={onSwitchToPlayer}
                className="px-3 py-1 text-xs rounded-full bg-blue-600 text-white border border-blue-500 hover:bg-blue-500"
              >
                Switch to Player
              </button>
              <button
                onClick={onSwitchToDM}
                className="px-3 py-1 text-xs rounded-full bg-green-600 text-white border border-green-500 hover:bg-green-500"
              >
                Switch to DM
              </button>
            </div>
          )}
        </div>
      </nav>
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