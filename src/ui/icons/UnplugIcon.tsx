// src/ui/icons/UnplugIcon.tsx

export function UnplugIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3.5 20.5l2.1-2.1" />
      <path d="M5.6 18.4l4.8-4.8 4 4-2.1 2.1a4.1 4.1 0 0 1-5.8 0l-.9-.9" />
      <path d="M11.6 12.4l1.7 1.7" />
      <path d="M14 10l1.7 1.7" />

      <path d="M20.5 3.5l-2.1 2.1" />
      <path d="M18.4 5.6l-4.8 4.8-4-4 2.1-2.1a4.1 4.1 0 0 1 5.8 0l.9.9" />
      <path d="M12.4 11.6l-1.7-1.7" />
      <path d="M10 14l-1.7-1.7" />
    </svg>
  );
}
