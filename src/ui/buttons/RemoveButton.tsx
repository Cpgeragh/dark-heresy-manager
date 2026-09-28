import { IconButton, type IconButtonProps } from "./IconButton";
import { uiIconButtonIconSize } from "../styles/buttonStyles";
import { TrashIcon } from "../icons/TrashIcon";

export function RemoveButton(props: Omit<IconButtonProps, "size">) {
  return <IconButton {...props} icon={<TrashIcon className={uiIconButtonIconSize.md} />} />;
}
