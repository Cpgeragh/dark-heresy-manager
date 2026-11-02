import { PendingOverlay } from "../ui/PendingOverlay";
import { uiLayerForeground } from "../ui/styles/layerStyles";

/** Keep the shared delayed indicator visible even when the page is scrolled. */
export function AppPanelLoading() {
  return (
    <div className={`fixed inset-0 pointer-events-none ${uiLayerForeground}`}>
      <PendingOverlay active />
    </div>
  );
}
