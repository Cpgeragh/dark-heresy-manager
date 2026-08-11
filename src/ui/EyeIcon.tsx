// src/ui/EyeIcon.tsx

export function EyeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -1.2 24 18.2"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M1.05 3.7C5.05 3.65 6.85-.3 11.7-.65c4.75-.35 7.5 3.75 11.3 3.35-3.15 2.1-6.2-.95-10.9-1.5C7.3.65 4.9 4.3 1.05 3.7Z"
      />
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M.15 8.45C4.55 6.05 7.3 3.15 12 3.15s7.45 2.9 11.85 5.3c-3.8 3.65-7.65 5.08-11.85 5.08S3.95 12.1.15 8.45Zm4.52.06C7.38 6.57 9.7 5.4 12 5.4s4.62 1.17 7.33 3.11C16.93 10.25 14.5 11.1 12 11.1s-4.93-.85-7.33-2.59Z"
        clipRule="evenodd"
      />
      <path
        fill="currentColor"
        stroke="currentColor"
        strokeWidth=".75"
        strokeLinejoin="miter"
        d="M1.35 9.85 8.2 16.1 4.55 11.35ZM22.65 9.85 15.8 16.1l3.65-4.75Z"
      />
      <path
        fill="currentColor"
        d="M10.58 3.7h2.84c.02 2.61-.4 4.66-1.42 6.62-1.02-1.96-1.44-4.01-1.42-6.62Z"
      />
    </svg>
  );
}
