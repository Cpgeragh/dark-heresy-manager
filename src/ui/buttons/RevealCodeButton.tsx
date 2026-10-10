// src/ui/buttons/RevealCodeButton.tsx
// The inline "Reveal" link that shows a character's recovery code, with waiting dots while it loads.

import { LoadingDots } from "../LoadingDots";
import { uiTextButton } from "../styles/buttonStyles";

interface RevealCodeButtonProps {
  revealing: boolean;
  onReveal: () => void | Promise<void>;
}

export function RevealCodeButton({ revealing, onReveal }: RevealCodeButtonProps) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        void onReveal();
      }}
      disabled={revealing}
      className={uiTextButton}
    >
      {revealing ? (
        <span>
          Revealing
          <LoadingDots />
        </span>
      ) : (
        "Reveal"
      )}
    </button>
  );
}
