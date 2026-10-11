import { colourDrawerBackdrop } from "./styles/colourTokens";
import { uiLayerBackdrop } from "./styles/layerStyles";

interface DrawerBackdropProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DrawerBackdrop({ isOpen, onClose }: DrawerBackdropProps) {
  return (
    <div
      className={`fixed inset-0 ${uiLayerBackdrop} ${colourDrawerBackdrop} backdrop-blur-sm transition-opacity duration-300 ${
        isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      onClick={onClose}
      aria-hidden="true"
    />
  );
}
