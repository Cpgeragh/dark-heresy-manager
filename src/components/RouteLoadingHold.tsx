import { useRouteLoading } from "../context/useRouteReady";

export function RouteLoadingHold() {
  useRouteLoading(true);
  return null;
}
