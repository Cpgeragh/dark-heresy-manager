import { IconButton, type IconButtonProps } from "./IconButton";
import { uiIconButtonIconSize } from "../styles/buttonStyles";
import { PencilIcon } from "../icons/PencilIcon";

export function EditButton(props: IconButtonProps) {
  return (
    <IconButton
      {...props}
      icon={<PencilIcon className={uiIconButtonIconSize[props.size ?? "md"]} />}
    />
  );
}
