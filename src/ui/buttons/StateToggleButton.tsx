import { NestedChip } from "../chips/Chip";
import { uiLayerLocal } from "../styles/layerStyles";
import { Button } from "./Button";

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
    <Button
      size="xs"
      variant={active ? "successOutline" : "ghost"}
      disabled={disabled && !active}
      loadingLabel={active ? activeBusyLabel : inactiveBusyLabel}
      title={title}
      className={`relative ${uiLayerLocal} pointer-events-auto shrink-0 sm:h-7 sm:px-2.5 md:h-8 md:px-3 md:text-sm`}
      onClick={(event) => {
        event.stopPropagation();
        if (!disabled || active) return onChange();
      }}
    >
      {active ? activeLabel : inactiveLabel}
    </Button>
  );
}
