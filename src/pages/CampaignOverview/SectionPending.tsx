// src/pages/CampaignOverview/SectionPending.tsx

import { useRouteLoadTimedOut } from "../../context/useRouteReady";
import { PendingOverlay } from "../../ui/PendingOverlay";
import { RouteLoadError } from "../../ui/RouteLoadError";

export function SectionPending() {
  const timedOut = useRouteLoadTimedOut();

  if (timedOut) return <RouteLoadError resource="campaign" />;

  return (
    <div className="relative min-h-40">
      <PendingOverlay active />
    </div>
  );
}
