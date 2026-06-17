// src/components/CharacterBreadcrumb.tsx

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface CharacterBreadcrumbProps {
  isDM: boolean;
}

export function CharacterBreadcrumb({ isDM }: CharacterBreadcrumbProps) {
  const navigate = useNavigate();

  const label = isDM ? "← Back to DM Dashboard" : "← Back to My Characters";

  const target = isDM ? "/dm" : "/player";

  const handleClick = useCallback(() => {
    navigate(target);
  }, [navigate, target]);

  return (
    <div className="mb-4">
      <button
        onClick={handleClick}
        className="text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200"
      >
        {label}
      </button>
    </div>
  );
}
