// src/ui/icons/PickerArrows.tsx

import { colourIconMuted } from "../styles/colourTokens";

function Arrow({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      data-picker-arrow={direction}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={`h-4 w-4 shrink-0 ${colourIconMuted} ${direction === "left" ? "rotate-180" : ""}`}
    >
      <path
        d="M3.5 10h13m-5-5 5 5-5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArrowRight() {
  return <Arrow direction="right" />;
}

export function ArrowLeft() {
  return <Arrow direction="left" />;
}
