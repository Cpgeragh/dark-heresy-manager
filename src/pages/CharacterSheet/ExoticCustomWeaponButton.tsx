// src/pages/CharacterSheet/ExoticCustomWeaponButton.tsx

import { HammerIcon } from "../../ui/icons/HammerIcon";
import { uiIconButtonCustom } from "../../ui/styles/buttonStyles";

interface ExoticCustomWeaponButtonProps {
  onClick: () => void;
}

/** DM-only trigger for granting an off-career Exotic Weapon Training specialisation. */
export function ExoticCustomWeaponButton({ onClick }: ExoticCustomWeaponButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Add Exotic Weapon Training"
      className={`relative ${uiIconButtonCustom} !border-transparent`}
    >
      <svg
        className="absolute inset-0 h-full w-full animate-marching-dashes"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="4"
          y="4"
          width="92"
          height="92"
          rx="22"
          stroke="currentColor"
          strokeWidth="5"
          strokeDasharray="12.8 9.2"
        />
      </svg>
      <HammerIcon className="h-[18px] w-[18px]" />
    </button>
  );
}
