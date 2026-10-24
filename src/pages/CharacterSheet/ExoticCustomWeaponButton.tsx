// src/pages/CharacterSheet/ExoticCustomWeaponButton.tsx

import { AddButton } from "../../ui/buttons/AddButton";

interface ExoticCustomWeaponButtonProps {
  onClick: () => void;
}

/** DM-only trigger for granting an off-career Exotic Weapon Training specialisation. */
export function ExoticCustomWeaponButton({ onClick }: ExoticCustomWeaponButtonProps) {
  return <AddButton label="Add Exotic Weapon Training" size="sm" onClick={onClick} />;
}
