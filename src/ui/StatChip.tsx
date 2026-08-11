import { uiTextLabel } from "./editableStyles";

export function StatChip({
  label,
  value,
  size = "md",
  compactOnMobile = false,
}: {
  label: string;
  value: string | number;
  size?: "sm" | "md";
  compactOnMobile?: boolean;
}) {
  if (size === "sm") {
    return (
      <div className="flex flex-col items-center bg-slate-800/60 rounded border border-slate-700 px-1.5 py-0.5 min-w-[32px] lg:min-w-[38px]">
        <span className={uiTextLabel}>{label}</span>
        <span className="text-xs font-code text-slate-200 mt-0.5">{value || "—"}</span>
      </div>
    );
  }

  if (compactOnMobile) {
    return (
      <div className="flex min-w-0 w-full flex-col items-center bg-slate-800/60 rounded border border-slate-700 px-[clamp(2px,1vw,8px)] py-0.5 lg:w-auto lg:min-w-[44px] lg:px-2">
        <span className={`${uiTextLabel} max-w-full whitespace-nowrap text-center !text-[clamp(8px,2.5vw,10px)] leading-tight lg:!text-xs`}>
          {label}
        </span>
        <span className="max-w-full whitespace-nowrap text-center text-xs font-code text-slate-200 mt-0.5 !text-[clamp(9px,2.8vw,12px)] leading-tight lg:!text-sm">
          {value || "â€”"}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center bg-slate-800/60 rounded border border-slate-700 px-2 py-0.5 min-w-[36px] lg:min-w-[44px]">
      <span className={uiTextLabel}>{label}</span>
      <span className="text-xs lg:text-sm font-code text-slate-200 mt-0.5">{value || "—"}</span>
    </div>
  );
}
