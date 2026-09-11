import type { ButtonHTMLAttributes } from "react";

interface TitleHeaderActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  align?: "start" | "end";
}

/** Shared borderless action used in centred picker and form headers. */
export function TitleHeaderActionButton({
  align = "end",
  className = "",
  type = "button",
  ...props
}: TitleHeaderActionButtonProps) {
  const alignment = align === "start" ? "justify-self-start" : "justify-self-end";

  return (
    <button
      type={type}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center ${alignment} rounded-lg text-lg text-slate-400 transition hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-40 lg:text-xl ${className}`.trim()}
      {...props}
    />
  );
}
