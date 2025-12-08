// src/components/TabButton.tsx

interface TabButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export function TabButton({ label, active, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-sm border transition
        ${
          active
            ? "bg-amber-500 text-slate-900 border-amber-400"
            : "border-slate-600 text-slate-200 hover:bg-slate-800"
        }`}
    >
      {label}
    </button>
  );
}