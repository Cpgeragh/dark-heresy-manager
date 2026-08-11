// src/ui/PlusIcon.tsx

export function PlusIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <rect x="8.5" y="3" width="3" height="14" rx="1" />
      <rect x="3" y="8.5" width="14" height="3" rx="1" />
    </svg>
  );
}
