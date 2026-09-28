import { IconButton, type IconButtonProps } from "./IconButton";
import { uiIconButtonIconSize } from "../styles/buttonStyles";
import { PencilIcon } from "../icons/PencilIcon";

export function EditButton(props: Omit<IconButtonProps, "size">) {
  return <IconButton {...props} icon={<PencilIcon className={uiIconButtonIconSize.md} />} />;
}
