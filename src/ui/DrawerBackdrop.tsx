import { colourDrawerBackdrop } from "./styles/colourTokens";
import { uiBackdropBlur, uiDrawerDuration, uiLayerBackdrop } from "./styles/layerStyles";

interface DrawerBackdropProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DrawerBackdrop({ isOpen, onClose }: DrawerBackdropProps) {
  return (
    <div
      className={`fixed inset-0 ${uiLayerBackdrop} ${colourDrawerBackdrop} ${uiBackdropBlur.page} transition-opacity ${uiDrawerDuration} ${
        isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      onClick={onClose}
      aria-hidden="true"
    />
  );
}
