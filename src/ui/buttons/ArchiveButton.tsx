import { IconButton, type IconButtonProps } from "./IconButton";
import { uiIconButtonIconSize } from "../styles/buttonStyles";
import { ArchiveIcon } from "../icons/ArchiveIcon";

export function ArchiveButton(props: Omit<IconButtonProps, "size">) {
  return <IconButton {...props} icon={<ArchiveIcon className={uiIconButtonIconSize.md} />} />;
}
