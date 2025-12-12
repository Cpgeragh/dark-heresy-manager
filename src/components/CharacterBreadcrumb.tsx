import { useNavigate } from "react-router-dom";

interface CharacterBreadcrumbProps {
  isDM: boolean;
}

export function CharacterBreadcrumb({ isDM }: CharacterBreadcrumbProps) {
  const navigate = useNavigate();

  const label = isDM
    ? "← Back to DM Dashboard"
    : "← Back to My Characters";

  const target = isDM ? "/dm" : "/player";

  return (
    <div className="mb-4">
      <button
        onClick={() => navigate(target)}
        className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200"
      >
        {label}
      </button>
    </div>
  );
}