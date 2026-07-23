import { uiTextLabel } from "./editableStyles";

export function StatChip({
  label,
  value,
  size = "md",
}: {
  label: string;
  value: string | number;
  size?: "sm" | "md";
}) {
  if (size === "sm") {
    return (
      <div className="flex flex-col items-center bg-slate-800/60 rounded border border-slate-700 px-1.5 py-0.5 min-w-[32px] lg:min-w-[38px]">
        <span className={uiTextLabel}>{label}</span>
        <span className="text-xs font-code text-slate-200 mt-0.5">{value || "—"}</span>
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
