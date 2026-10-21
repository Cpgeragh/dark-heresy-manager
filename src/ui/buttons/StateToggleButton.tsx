import { NestedChip } from "../chips/Chip";
import { uiLayerLocal } from "../styles/layerStyles";
import { EntryActionButton } from "./EntryActionButton";

interface StateToggleButtonProps {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
  activeBusyLabel: string;
  inactiveBusyLabel: string;
  statusLabel: string;
  disabled: boolean;
  editable: boolean;
  onChange: () => void | Promise<void>;
  disabledTitle?: string;
}

/** The button that switches an entry between two states, such as Equip and Unequip. */
export function StateToggleButton({
  active,
  activeLabel,
  inactiveLabel,
  activeBusyLabel,
  inactiveBusyLabel,
  statusLabel,
  disabled,
  editable,
  onChange,
  disabledTitle,
}: StateToggleButtonProps) {
  if (!editable) {
    return active ? (
      <NestedChip colour="emerald" className="uppercase tracking-wide shrink-0">
        {statusLabel}
      </NestedChip>
    ) : null;
  }
  const inactiveTitle = `Click to ${inactiveLabel.toLowerCase()}`;
  const title = active
    ? `Click to ${activeLabel.toLowerCase()}`
    : disabled && disabledTitle
      ? disabledTitle
      : inactiveTitle;
  return (
    <EntryActionButton
      variant={active ? "successOutline" : "ghost"}
      disabled={disabled && !active}
      loadingLabel={active ? activeBusyLabel : inactiveBusyLabel}
      title={title}
      className={`relative ${uiLayerLocal} pointer-events-auto shrink-0`}
      onClick={(event) => {
        event.stopPropagation();
        if (!disabled || active) return onChange();
      }}
    >
      {active ? activeLabel : inactiveLabel}
    </EntryActionButton>
  );
}
