// src/ui/buttons/ViewButton.tsx
import { IconButton, type IconButtonProps } from "./IconButton";
import { uiIconButtonIconSize } from "../styles/buttonStyles";
import { EyeIcon } from "../icons/EyeIcon";

export function ViewButton({ size = "md", ...props }: IconButtonProps) {
  return (
    <IconButton
      {...props}
      size={size}
      icon={<EyeIcon className={uiIconButtonIconSize[size]} />}
    />
  );
}
