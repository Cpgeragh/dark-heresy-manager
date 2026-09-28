import { IconButton, type IconButtonProps } from "./IconButton";
import { uiIconButtonIconSize } from "../styles/buttonStyles";
import { UnlinkIcon } from "../icons/UnlinkIcon";

export function UnlinkButton(props: Omit<IconButtonProps, "size">) {
  return <IconButton {...props} icon={<UnlinkIcon className={uiIconButtonIconSize.md} />} />;
}
