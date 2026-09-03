import { useRef, type KeyboardEvent } from "react";
import { segmentedTabId, segmentedTabPanelId } from "./styles/segmentedTabStyles";

export interface SegmentedTabOption<T extends string> {
  value: T;
  label: string;
  activeClassName: string;
  ariaLabel?: string;
}

interface SegmentedTabsProps<T extends string> {
  id: string;
  ariaLabel: string;
  options: readonly SegmentedTabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

const tabButtonBase =
  "rounded-md px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-semibold transition border";
const tabButtonBaseNarrow =
  "rounded-md px-2 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-semibold transition border";
const tabButtonBaseCompact =
  "rounded-md px-1 py-1.5 text-[11px] font-semibold transition border";
const tabButtonInactive =
  "border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200";

function tabButtonClass(optionCount: number) {
  if (optionCount <= 2) return tabButtonBase;
  if (optionCount === 3) return tabButtonBaseNarrow;
  return tabButtonBaseCompact;
}

export function SegmentedTabs<T extends string>({
  id,
  ariaLabel,
  options,
  value,
  onChange,
  className = "",
}: SegmentedTabsProps<T>) {
  const buttonRefs = useRef(new Map<T, HTMLButtonElement>());

  const selectAndFocus = (index: number) => {
    if (options.length === 0) return;
    const next = options[(index + options.length) % options.length];
    onChange(next.value);
    buttonRefs.current.get(next.value)?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") nextIndex = index + 1;
    if (event.key === "ArrowLeft") nextIndex = index - 1;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = options.length - 1;

    if (nextIndex === null) return;
    event.preventDefault();
    selectAndFocus(nextIndex);
  };

  return (
    <div
      className={[
        "grid rounded-lg border border-slate-600 bg-slate-950/70 p-1",
        options.length >= 4 ? "gap-1" : "",
        className,
      ].join(" ")}
      style={{ gridTemplateColumns: `repeat(${Math.max(options.length, 1)}, minmax(0, 1fr))` }}
      role="tablist"
      aria-label={ariaLabel}
      aria-orientation="horizontal"
    >
      {options.map((option, index) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            ref={(element) => {
              if (element) buttonRefs.current.set(option.value, element);
              else buttonRefs.current.delete(option.value);
            }}
            id={segmentedTabId(id, option.value)}
            type="button"
            role="tab"
            aria-label={option.ariaLabel}
            aria-selected={active}
            aria-controls={segmentedTabPanelId(id, option.value)}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={[
              tabButtonClass(options.length),
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300",
              active ? option.activeClassName : tabButtonInactive,
            ].join(" ")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
