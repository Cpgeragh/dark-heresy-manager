// src/ui/buttons/HistoryButton.tsx
import { IconButton, type IconButtonProps } from "./IconButton";
import { uiIconButtonIconSize } from "../styles/buttonStyles";
import { HistoryIcon } from "../icons/HistoryIcon";

export function HistoryButton({ size = "md", ...props }: IconButtonProps) {
  return (
    <IconButton
      {...props}
      size={size}
      icon={<HistoryIcon className={uiIconButtonIconSize[size]} />}
    />
  );
}
