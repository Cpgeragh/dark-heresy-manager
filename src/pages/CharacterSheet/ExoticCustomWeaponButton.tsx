// src/pages/CharacterSheet/ExoticCustomWeaponButton.tsx

import { HammerIcon } from "../../ui/icons/HammerIcon";
import { MarchingBorder } from "../../ui/icons/MarchingBorder";
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
      <MarchingBorder />
      <HammerIcon className="h-[18px] w-[18px]" />
    </button>
  );
}
