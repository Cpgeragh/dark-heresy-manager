import { uiCell, uiTextLabel } from "../styles/editableStyles";
import { colourTextPrimary } from "../styles/colourTokens";

interface StatChipProps {
  label: string;
  value: string | number;
  valueColour?: string;
}

interface StatChipBaseProps extends StatChipProps {
  size: "sm" | "md";
}

function StatChipBase({ label, value, size, valueColour = colourTextPrimary }: StatChipBaseProps) {
  const displayValue = value === "" || value === null || value === undefined ? "—" : value;

  if (size === "sm") {
    return (
      <div
        className={`${uiCell} flex min-w-0 flex-col items-center px-[clamp(2px,1vw,6px)] py-0.5 lg:min-w-[38px] lg:px-1.5 [&>span:last-child]:max-w-full [&>span:last-child]:whitespace-nowrap [&>span:last-child]:text-center [&>span:last-child]:!text-[clamp(9px,2.8vw,12px)] [&>span:last-child]:leading-tight lg:[&>span:last-child]:!text-xs`}
      >
        <span
          className={`${uiTextLabel} max-w-full whitespace-nowrap text-center !text-[clamp(8px,2.5vw,10px)] leading-tight lg:!text-xs`}
        >
          {label}
        </span>
        <span className={`text-xs font-code ${valueColour} mt-0.5`}>{displayValue}</span>
      </div>
    );
  }

  return (
    <div
      className={`${uiCell} flex flex-col items-center px-2 py-0.5 min-w-[36px] lg:min-w-[44px]`}
    >
      <span className={uiTextLabel}>{label}</span>
      <span className={`text-xs lg:text-sm font-code ${valueColour} mt-0.5`}>{displayValue}</span>
    </div>
  );
}

export function StatChip(props: StatChipProps) {
  return <StatChipBase {...props} size="md" />;
}

export function NestedStatChip(props: StatChipProps) {
  return <StatChipBase {...props} size="sm" />;
}
