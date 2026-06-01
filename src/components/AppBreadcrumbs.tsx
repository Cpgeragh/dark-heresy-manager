// src/components/AppBreadcrumbs.tsx

import { Link } from "react-router-dom";

interface AppBreadcrumbsProps {
  isDM: boolean;
  pathname: string;
}

export function AppBreadcrumbs({ isDM, pathname }: AppBreadcrumbsProps) {
  const segments = pathname.split("/").filter(Boolean);

  // No breadcrumbs on root dashboards
  if (segments.length === 0) return null;

  const crumbs: { label: string; to?: string }[] = [];

  if (isDM) {
    crumbs.push({ label: "DM Dashboard", to: "/dm" });
  } else {
    crumbs.push({ label: "My Characters", to: "/player" });
  }

  if (segments.includes("campaign")) {
    crumbs.push({
      label: "Campaign",
      to: isDM ? "/dm" : "/player",
    });
  }

  if (segments.includes("character")) {
    crumbs.push({ label: "Character" });
  }

  if (crumbs.length <= 1) return null;

  return (
    <nav
      className="
        max-w-5xl mx-auto px-4
        text-sm text-slate-400
        flex flex-wrap items-center gap-2
        mt-3
      "
      aria-label="Breadcrumb"
    >
      {crumbs.map((crumb, index) => (
        <span key={index} className="flex items-center gap-2">
          {crumb.to ? (
            <Link to={crumb.to} className="hover:text-slate-200 transition">
              {crumb.label}
            </Link>
          ) : (
            <span className="text-slate-200">{crumb.label}</span>
          )}
          {index < crumbs.length - 1 && <span>→</span>}
        </span>
      ))}
    </nav>
  );
}