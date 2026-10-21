import type { ComponentProps } from "react";
import { uiEntryActionSize } from "../styles/buttonStyles";
import { Button } from "./Button";

type EntryActionButtonProps = Omit<ComponentProps<typeof Button>, "size">;

/** The button for an action on an owned entry, such as Upgrade, Edit Rolls, Escalate, Wear or Equip. */
export function EntryActionButton({ className = "", ...props }: EntryActionButtonProps) {
  return <Button size="xs" className={`${uiEntryActionSize} ${className}`.trim()} {...props} />;
}
