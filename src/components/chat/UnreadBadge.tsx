// src/components/chat/UnreadBadge.tsx

import { colourAmberFill } from "../../ui/styles/colourTokens";

const MAX_SHOWN = 99;

export function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span
      aria-hidden="true"
      className={`text-xs lg:text-sm px-1.5 lg:px-2 py-0.5 ${colourAmberFill} rounded-full font-semibold leading-none`}
    >
      {count > MAX_SHOWN ? `${MAX_SHOWN}+` : count}
    </span>
  );
}
