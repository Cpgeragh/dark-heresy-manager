import { uiInlineRow } from "../ui/styles/editableStyles";

import type { ReactNode } from "react";
import { colourTextPrimary, colourDivider, colourFillHeader } from "../ui/styles/colourTokens";
import { uiLayerForeground } from "../ui/styles/layerStyles";

interface AppHeaderShellProps {
  left?: ReactNode;
  right?: ReactNode;
}

export function AppHeaderShell({ left, right }: AppHeaderShellProps) {
  return (
    <header
      className={`sticky top-0 ${uiLayerForeground} border-b ${colourDivider} ${colourFillHeader} backdrop-blur`}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-4 py-2 lg:px-6">
        <div className={`${uiInlineRow}`}>{left}</div>

        <div className="pointer-events-none flex items-center justify-center">
          <span className={`font-cinzel text-base font-bold tracking-wide ${colourTextPrimary}`}>
            Dark Heresy Manager
          </span>
        </div>

        <div className={`${uiInlineRow} justify-end`}>{right}</div>
      </div>
    </header>
  );
}
