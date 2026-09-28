// src/ui/buttons/AddButton.tsx
import { IconButton, type IconButtonProps } from "./IconButton";
import { uiIconButtonIconSize } from "../styles/buttonStyles";
import { PlusIcon } from "../icons/PlusIcon";

export function AddButton({ size = "md", ...props }: IconButtonProps) {
  return (
    <IconButton
      {...props}
      size={size}
      icon={<PlusIcon className={uiIconButtonIconSize[size]} />}
    />
  );
}
