import { IconButton, type IconButtonProps } from "./IconButton";
import { UnlinkIcon } from "../icons/UnlinkIcon";

export function DisconnectButton(props: Omit<IconButtonProps, "size">) {
  return <IconButton {...props} icon={<UnlinkIcon />} />;
}
