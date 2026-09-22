export function QrCodeIcon({ className = "w-[18px] h-[18px]" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M2.75 2.75h7.5v7.5h-7.5zM13.75 2.75h7.5v7.5h-7.5zM2.75 13.75h7.5v7.5h-7.5z" />
      <path d="M5.25 5.25h2.5v2.5h-2.5zM16.25 5.25h2.5v2.5h-2.5zM5.25 16.25h2.5v2.5h-2.5z" />
      <path d="M13.75 13.75h3.25v3.25h-3.25zM20.75 13.75v3.25M13.75 20.75H17M20.75 20.75h-1.5" />
    </svg>
  );
}
