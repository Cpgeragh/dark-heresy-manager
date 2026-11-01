import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { RangedCard } from "../../src/pages/CharacterSheet/weapons/RangedCard";
import { MeleeCard } from "../../src/pages/CharacterSheet/weapons/MeleeCard";
import { GrenadeCard } from "../../src/pages/CharacterSheet/weapons/GrenadeCard";
import { ShieldCard } from "../../src/pages/CharacterSheet/weapons/ShieldCard";
import { ArcheotechWeaponCard } from "../../src/pages/CharacterSheet/weapons/ArcheotechWeaponCard";
import { ArcheotechShieldRow } from "../../src/pages/CharacterSheet/weapons/ArcheotechShieldRow";
import { PieceRow } from "../../src/pages/CharacterSheet/ArmourTab/PieceRow";
import { ForceFieldRow } from "../../src/pages/CharacterSheet/ArmourTab/ForceFieldRow";
import { ArcheotechArmourRow } from "../../src/pages/CharacterSheet/ArmourTab/ArcheotechArmourRow";
import { ArcheotechForceFieldRow } from "../../src/pages/CharacterSheet/ArmourTab/ArcheotechForceFieldRow";
import { ImplantRow } from "../../src/pages/CharacterSheet/CyberneticsTab/ImplantRow";
import { ArcheotechImplantRow } from "../../src/pages/CharacterSheet/CyberneticsTab/ArcheotechImplantRow";
import { PowerCard } from "../../src/pages/CharacterSheet/PsychicTab/PowerCard";
import { SkillGroupRow } from "../../src/pages/CharacterSheet/SkillsTab/SkillGroupRow";
import type { SkillWithComputed } from "../../src/pages/CharacterSheet/SkillsTab/skillsConstants";
import { TalentGroupCard } from "../../src/mechanics/talents/TalentEntryCards";
import type {
  ArcheotechItem,
  GrenadeItem,
  PsychicPower,
  RangedWeapon,
  MeleeWeapon,
  ShieldItem,
  WornArmourPiece,
} from "../../src/types/Character";

const none = () => undefined;

const ranged: RangedWeapon = {
  id: "w1",
  name: "Custom Lasgun",
  class: "Basic",
  damage: "1d10+3 E",
  range: "100m",
  clip: "60",
  pen: "0",
  rld: "Full",
  custom: true,
};
const melee: MeleeWeapon = {
  id: "m1",
  name: "Custom Chainsword",
  class: "Melee",
  damage: "1d10+3 R",
  pen: "2",
  custom: true,
};
const grenade: GrenadeItem = {
  id: "g1",
  name: "Custom Frag",
  quantity: 5,
  type: "Grenade",
  class: "Thrown",
  damage: "2d10 X",
  pen: "0",
  custom: true,
};
const shield: ShieldItem = {
  id: "s1",
  name: "Custom Buckler",
  ap: 2,
  locations: "Arm",
  damage: "1d10 I",
  pen: "0",
  specialRules: "Defensive",
  custom: true,
};
const relic = (type: ArcheotechItem["type"]) =>
  ({ id: "x1", name: "Relic", type, equipped: true }) as ArcheotechItem;
const armour: WornArmourPiece = {
  id: "a1",
  name: "Flak Jacket",
  locations: ["body"],
  ap: 3,
  worn: true,
};
const forceField: WornArmourPiece = {
  ...armour,
  id: "f1",
  name: "Refraction Field",
  isForceField: true,
  protectionRating: 30,
};

interface Case {
  label: string;
  name: string;
  toggle: RegExp;
  element: ReactElement;
}

const EQUIP = /^(Equip|Unequip)$/;

/** Every card with an equip, wear, activate or install button, drawn with that state switched on. */
const equipCases: Case[] = [
  {
    label: "the Ranged weapon card",
    name: "Custom Lasgun",
    toggle: EQUIP,
    element: (
      <RangedCard
        weapon={{ ...ranged, equipped: true }}
        editable
        isEquipped
        onToggleEquip={none}
        onRemove={none}
        onAddUpgrade={none}
        onRemoveUpgrade={none}
        onUpdateAmmoEntries={none}
        onUpdateQuantity={none}
      />
    ),
  },
  {
    label: "the Melee weapon card",
    name: "Custom Chainsword",
    toggle: EQUIP,
    element: (
      <MeleeCard
        weapon={{ ...melee, equipped: true }}
        editable
        isEquipped
        strengthBonus={4}
        onToggleEquip={none}
        onRemove={none}
        onAddUpgrade={none}
        onRemoveUpgrade={none}
        onUpdateQuantity={none}
      />
    ),
  },
  {
    label: "the Grenade card",
    name: "Custom Frag",
    toggle: EQUIP,
    element: (
      <GrenadeCard
        item={{ ...grenade, equipped: true }}
        editable
        isEquipped
        strengthBonus={4}
        onToggleEquip={none}
        onRemove={none}
        onUpdateQty={none}
      />
    ),
  },
  {
    label: "the Shield card",
    name: "Custom Buckler",
    toggle: EQUIP,
    element: (
      <ShieldCard
        item={{ ...shield, equipped: true }}
        editable
        isEquipped
        onToggleEquip={none}
        onRemove={none}
      />
    ),
  },
  {
    label: "the Archeotech weapon card",
    name: "Relic",
    toggle: EQUIP,
    element: (
      <ArcheotechWeaponCard
        item={relic("Weapon")}
        editable
        isEquipped
        onToggleEquip={none}
        onRemove={none}
      />
    ),
  },
  {
    label: "the Archeotech shield card",
    name: "Relic",
    toggle: EQUIP,
    element: (
      <ArcheotechShieldRow
        item={relic("Shield")}
        editable
        isEquipped
        onToggleEquip={none}
        onRemove={none}
      />
    ),
  },
  {
    label: "the Armour piece card",
    name: "Flak Jacket",
    toggle: /^(Stow|Wear)$/,
    element: <PieceRow piece={armour} editable worn onToggle={none} onRemove={none} />,
  },
  {
    label: "the Force field card",
    name: "Refraction Field",
    toggle: /^(Activate|Deactivate)$/,
    element: <ForceFieldRow piece={forceField} editable onToggle={none} onRemove={none} />,
  },
  {
    label: "the Archeotech armour card",
    name: "Relic",
    toggle: /^(Stow|Wear)$/,
    element: (
      <ArcheotechArmourRow item={relic("Armour")} editable onToggleEquip={none} onRemove={none} />
    ),
  },
  {
    label: "the Archeotech force field card",
    name: "Relic",
    toggle: /^(Activate|Deactivate)$/,
    element: (
      <ArcheotechForceFieldRow
        item={relic("Force Field")}
        editable
        onToggleEquip={none}
        onRemove={none}
      />
    ),
  },
  {
    label: "the Implant card",
    name: "Auto-Quill",
    toggle: /^(Install|Uninstall)$/,
    element: (
      <ImplantRow
        item={{ id: "y1", name: "Auto-Quill" }}
        editable
        onToggleInstalled={none}
        onRemove={none}
      />
    ),
  },
  {
    label: "the Archeotech implant card",
    name: "Relic",
    toggle: /^(Install|Uninstall)$/,
    element: (
      <ArcheotechImplantRow
        item={relic("Cybernetic")}
        editable
        onToggleInstalled={none}
        onRemove={none}
      />
    ),
  },
];

const skill = {
  id: "dodge",
  name: "Dodge",
  characteristic: "ag",
  level: "trained",
  category: "General",
  advanced: false,
  source: "Core",
  total: 35,
} as unknown as SkillWithComputed;

/** Cards that have no equip button but must still start collapsed. */
const groupCases: Case[] = [
  {
    label: "the Psychic power card",
    name: "Smite",
    toggle: /./,
    element: (
      <PowerCard power={{ id: "p1", name: "Smite" } as PsychicPower} editable onRemove={none} />
    ),
  },
  {
    label: "the Skill group card",
    name: "General",
    toggle: /./,
    element: <SkillGroupRow category="General" skills={[skill]} editable updateLevel={none} />,
  },
  {
    label: "the Talent group card",
    name: "Hatred",
    toggle: /./,
    element: (
      <TalentGroupCard
        name="Hatred"
        entries={[{ uid: "t1", talentId: "hatred", name: "Hatred (Heretics)" }]}
        editable
        onRemove={none}
      />
    ),
  },
];

const expandButton = (name: string) =>
  screen.getByRole("button", { name: `Expand ${name} details` });

describe("cards start collapsed", () => {
  it.each([...equipCases, ...groupCases])("$label starts collapsed", ({ name, element }) => {
    render(element);

    expect(expandButton(name)).toHaveAttribute("aria-expanded", "false");
  });
});

describe("equipping leaves a card as it was", () => {
  it.each(equipCases)(
    "pressing the button on $label does not open it",
    async ({ name, toggle, element }) => {
      const user = userEvent.setup();
      render(element);

      await user.click(screen.getByRole("button", { name: toggle }));

      expect(expandButton(name)).toHaveAttribute("aria-expanded", "false");
    }
  );

  it("does not close a card the player opened", async () => {
    const user = userEvent.setup();
    const { name, toggle, element } = equipCases[0];
    render(element);

    await user.click(expandButton(name));
    await user.click(screen.getByRole("button", { name: toggle }));

    expect(screen.getByRole("button", { name: `Collapse ${name} details` })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  });
});
