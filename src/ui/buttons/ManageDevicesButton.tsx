import { IconButton, type IconButtonProps } from "./IconButton";
import { uiIconButtonIconSize } from "../styles/buttonStyles";
import { DevicesIcon } from "../icons/DevicesIcon";

export function ManageDevicesButton(props: Omit<IconButtonProps, "size">) {
  return <IconButton {...props} icon={<DevicesIcon className={uiIconButtonIconSize.md} />} />;
}
