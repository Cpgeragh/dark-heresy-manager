import { useState, type ReactNode } from "react";
import { useLocation, type Location } from "react-router-dom";
import { RouteReadyProvider } from "../context/RouteReadyContext";
import { PendingOverlay } from "../ui/PendingOverlay";
import { SplashScreen } from "./SplashScreen";

interface RouteHolderProps {
  routes: (location: Location) => ReactNode;
  splashLabel: string;
}

export function RouteHolder({ routes, splashLabel }: RouteHolderProps) {
  const location = useLocation();
  const [shown, setShown] = useState<Location | null>(null);

  if (shown !== null && shown.pathname === location.pathname && shown !== location) {
    setShown(location);
  }

  const waiting = shown === null || shown.pathname !== location.pathname;
  const views: { location: Location; visible: boolean }[] = [];
  if (shown !== null) views.push({ location: shown, visible: true });
  if (waiting) views.push({ location, visible: false });

  return (
    <div className="relative">
      {views.map((view) => (
        <div key={view.location.pathname} hidden={!view.visible}>
          <RouteReadyProvider
            active={view.visible}
            onReady={view.visible ? undefined : () => setShown(location)}
          >
            {routes(view.location)}
          </RouteReadyProvider>
        </div>
      ))}
      <PendingOverlay active={shown !== null && waiting} />
      {shown === null && (
        <div className="fixed inset-0 z-50">
          <SplashScreen label={splashLabel} />
        </div>
      )}
    </div>
  );
}
