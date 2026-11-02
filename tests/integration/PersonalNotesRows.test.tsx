import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { PersonalNotesContext } from "../../src/context/PersonalNotesContext";
import { ItemRow } from "../../src/pages/CharacterSheet/GearTab/ItemRow";
import { ConsumableRow } from "../../src/pages/CharacterSheet/GearTab/ConsumableRow";
import { DrugRow } from "../../src/pages/CharacterSheet/DrugsTab/DrugRow";
import { ImplantRow } from "../../src/pages/CharacterSheet/CyberneticsTab/ImplantRow";
import { ArcheotechImplantRow } from "../../src/pages/CharacterSheet/CyberneticsTab/ArcheotechImplantRow";
import { PieceRow } from "../../src/pages/CharacterSheet/ArmourTab/PieceRow";
import { ForceFieldRow } from "../../src/pages/CharacterSheet/ArmourTab/ForceFieldRow";
import { ArcheotechArmourRow } from "../../src/pages/CharacterSheet/ArmourTab/ArcheotechArmourRow";
import { ArcheotechForceFieldRow } from "../../src/pages/CharacterSheet/ArmourTab/ArcheotechForceFieldRow";
import { ItemCard } from "../../src/pages/CharacterSheet/ArcheotechTab/ItemCard";
import { SkillRow } from "../../src/pages/CharacterSheet/SkillsTab/SkillRow";
import type { SkillWithComputed } from "../../src/pages/CharacterSheet/SkillsTab/skillsConstants";
import { EntryCard } from "../../src/mechanics/talents/TalentEntryCards";
import { CorruptionEntryRow } from "../../src/mechanics/corruption/CorruptionEntryRow";
import { DisordersList, TraumaList } from "../../src/mechanics/insanity/InsanityEntryLists";
import type { PersonalNotesCollection } from "../../src/utils/personalNotes";
import type { ArcheotechItem, WornArmourPiece } from "../../src/types/Character";
import { openEntryCard } from "../utils/entryCard";
import { RangedCard } from "../../src/pages/CharacterSheet/weapons/RangedCard";
import { MeleeCard } from "../../src/pages/CharacterSheet/weapons/MeleeCard";
import { GrenadeCard } from "../../src/pages/CharacterSheet/weapons/GrenadeCard";
import { ShieldCard } from "../../src/pages/CharacterSheet/weapons/ShieldCard";
import { ArcheotechWeaponCard } from "../../src/pages/CharacterSheet/weapons/ArcheotechWeaponCard";
import { ArcheotechShieldRow } from "../../src/pages/CharacterSheet/weapons/ArcheotechShieldRow";
import { PowerCard } from "../../src/pages/CharacterSheet/PsychicTab/PowerCard";
import { CompanionsTab } from "../../src/pages/CharacterSheet/CompanionsTab";
import type { PsychicPower } from "../../src/types/Character";

const archeotechItem = (type: ArcheotechItem["type"]): ArcheotechItem =>
  ({ id: "x1", name: "Relic", type }) as ArcheotechItem;

const armourPiece: WornArmourPiece = {
  id: "a1",
  name: "Flak Jacket",
  locations: ["body"],
  ap: 3,
  worn: true,
};

const forceField: WornArmourPiece = {
  id: "f1",
  name: "Refraction Field",
  locations: [],
  ap: 0,
  worn: true,
  isForceField: true,
  protectionRating: 30,
};

const grenade = {
  id: "g1",
  name: "Custom Frag",
  quantity: 5,
  type: "Grenade",
  class: "Thrown",
  damage: "2d10 X",
  pen: "0",
  custom: true,
} as const;

const shield = {
  id: "s1",
  name: "Custom Buckler",
  ap: 2,
  locations: "Arm",
  damage: "1d10 I",
  pen: "0",
  specialRules: "Defensive",
  custom: true,
} as const;

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

interface Case {
  label: string;
  collection: PersonalNotesCollection;
  id: string;
  name: string;
  collapsible: boolean;
  element: ReactElement;
}

const none = () => undefined;

const cases: Case[] = [
  {
    label: "a Gear item",
    collection: "gear",
    id: "g1",
    name: "Auspex",
    collapsible: true,
    element: <ItemRow item={{ id: "g1", name: "Auspex" }} editable onRemove={none} />,
  },
  {
    label: "a Consumable",
    collection: "consumables",
    id: "c1",
    name: "Ration Pack",
    collapsible: true,
    element: (
      <ConsumableRow
        item={{ id: "c1", name: "Ration Pack", quantity: 1 }}
        editable
        onUpdateQty={none}
        onRemove={none}
      />
    ),
  },
  {
    label: "a Drug",
    collection: "drugs",
    id: "d1",
    name: "Obscura",
    collapsible: true,
    element: (
      <DrugRow
        item={{ id: "d1", name: "Obscura", quantity: 1 }}
        editable
        onUpdateQty={none}
        onRemove={none}
      />
    ),
  },
  {
    label: "an Implant",
    collection: "cybernetics",
    id: "y1",
    name: "Auto-Quill",
    collapsible: true,
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
    label: "an Archeotech Implant",
    collection: "archeotech",
    id: "x1",
    name: "Relic",
    collapsible: true,
    element: (
      <ArcheotechImplantRow
        item={archeotechItem("Cybernetic")}
        editable
        onToggleInstalled={none}
        onRemove={none}
      />
    ),
  },
  {
    label: "an Armour Piece",
    collection: "armour",
    id: "a1",
    name: "Flak Jacket",
    collapsible: true,
    element: <PieceRow piece={armourPiece} editable worn onToggle={none} onRemove={none} />,
  },
  {
    label: "a Force Field",
    collection: "armour",
    id: "f1",
    name: "Refraction Field",
    collapsible: true,
    element: <ForceFieldRow piece={forceField} editable onToggle={none} onRemove={none} />,
  },
  {
    label: "Archeotech armour",
    collection: "archeotech",
    id: "x1",
    name: "Relic",
    collapsible: true,
    element: (
      <ArcheotechArmourRow
        item={archeotechItem("Armour")}
        editable
        onToggleEquip={none}
        onRemove={none}
      />
    ),
  },
  {
    label: "an Archeotech Force Field",
    collection: "archeotech",
    id: "x1",
    name: "Relic",
    collapsible: true,
    element: (
      <ArcheotechForceFieldRow
        item={archeotechItem("Force Field")}
        editable
        onToggleEquip={none}
        onRemove={none}
      />
    ),
  },
  {
    label: "an Archeotech Item",
    collection: "archeotech",
    id: "x1",
    name: "Relic",
    collapsible: true,
    element: <ItemCard item={archeotechItem("Gear")} editable onRemove={none} />,
  },
  {
    label: "a Skill",
    collection: "skills",
    id: "dodge",
    name: "Dodge",
    collapsible: true,
    element: <SkillRow skill={skill} editable updateLevel={none} />,
  },
  {
    label: "a Talent",
    collection: "talents",
    id: "t1",
    name: "Ambidextrous",
    collapsible: true,
    element: (
      <EntryCard
        entry={{ uid: "t1", talentId: "ambidextrous", name: "Ambidextrous" }}
        editable
        onRemove={none}
      />
    ),
  },
  {
    label: "a Trait",
    collection: "traits",
    id: "r1",
    name: "Unnatural Strength",
    collapsible: true,
    element: (
      <EntryCard
        entry={{ uid: "r1", talentId: "unnatural-strength", name: "Unnatural Strength" }}
        editable
        onRemove={none}
        removalNoun="Trait"
      />
    ),
  },
  {
    label: "an Elite Advance",
    collection: "eliteAdvances",
    id: "e1",
    name: "Iron Jaw",
    collapsible: true,
    element: (
      <EntryCard
        entry={{ uid: "e1", talentId: "iron-jaw", name: "Iron Jaw" }}
        editable
        onRemove={none}
        removalNoun="Elite Advance"
      />
    ),
  },
  {
    label: "a Mutation",
    collection: "mutations",
    id: "n1",
    name: "Extra Toes",
    collapsible: false,
    element: (
      <CorruptionEntryRow
        kind="Mutation"
        entry={{ id: "n1", name: "Extra Toes", custom: true }}
        editable
        onRemove={none}
        onUpdateRolls={none}
      />
    ),
  },
  {
    label: "a Malignancy",
    collection: "malignancies",
    id: "m1",
    name: "Weeping Eyes",
    collapsible: false,
    element: (
      <CorruptionEntryRow
        kind="Malignancy"
        entry={{ id: "m1", name: "Weeping Eyes", custom: true }}
        editable
        onRemove={none}
        onUpdateRolls={none}
      />
    ),
  },
  {
    label: "a Disorder",
    collection: "disorders",
    id: "d1",
    name: "Fear of Heights",
    collapsible: false,
    element: (
      <DisordersList
        disorders={[{ id: "d1", type: "Phobia", name: "Fear of Heights", severity: "Minor" }]}
        legacyDisorders=""
        editable
        onRemove={none}
        onEscalate={none}
        onLegacyChange={none}
      />
    ),
  },
  {
    label: "a Trauma",
    collection: "trauma",
    id: "tr1",
    name: "Shell Shock",
    collapsible: false,
    element: (
      <TraumaList
        trauma={[{ id: "tr1", name: "Shell Shock", custom: true }]}
        editable
        onRemove={none}
      />
    ),
  },
  {
    label: "a Ranged weapon",
    collection: "ranged",
    id: "w1",
    name: "Custom Lasgun",
    collapsible: false,
    element: (
      <RangedCard
        weapon={{
          id: "w1",
          name: "Custom Lasgun",
          class: "Basic",
          damage: "1d10+3 E",
          range: "100m",
          clip: "60",
          pen: "0",
          rld: "Full",
          custom: true,
        }}
        editable
        forceExpanded
        onRemove={none}
        onAddUpgrade={none}
        onRemoveUpgrade={none}
        onUpdateAmmoEntries={none}
        onUpdateQuantity={none}
      />
    ),
  },
  {
    label: "a Melee weapon",
    collection: "melee",
    id: "m1",
    name: "Custom Chainsword",
    collapsible: false,
    element: (
      <MeleeCard
        weapon={{
          id: "m1",
          name: "Custom Chainsword",
          class: "Melee",
          damage: "1d10+3 R",
          pen: "2",
          custom: true,
        }}
        editable
        strengthBonus={4}
        forceExpanded
        onRemove={none}
        onAddUpgrade={none}
        onRemoveUpgrade={none}
        onUpdateQuantity={none}
      />
    ),
  },
  {
    label: "a Grenade",
    collection: "grenades",
    id: "g1",
    name: "Custom Frag",
    collapsible: true,
    element: (
      <GrenadeCard
        item={grenade}
        editable
        strengthBonus={4}
        isEquipped
        onRemove={none}
        onUpdateQty={none}
      />
    ),
  },
  {
    label: "a Shield",
    collection: "shields",
    id: "s1",
    name: "Custom Buckler",
    collapsible: true,
    element: <ShieldCard item={shield} editable isEquipped onRemove={none} />,
  },
  {
    label: "an Archeotech weapon",
    collection: "archeotech",
    id: "x1",
    name: "Relic",
    collapsible: true,
    element: (
      <ArcheotechWeaponCard item={archeotechItem("Weapon")} editable isEquipped onRemove={none} />
    ),
  },
  {
    label: "an Archeotech shield",
    collection: "archeotech",
    id: "x1",
    name: "Relic",
    collapsible: true,
    element: (
      <ArcheotechShieldRow item={archeotechItem("Shield")} editable isEquipped onRemove={none} />
    ),
  },
  {
    label: "a Psychic Power",
    collection: "powers",
    id: "p1",
    name: "Smite",
    collapsible: true,
    element: (
      <PowerCard power={{ id: "p1", name: "Smite" } as PsychicPower} editable onRemove={none} />
    ),
  },
  {
    label: "a Companion",
    collection: "companions",
    id: "companion-1",
    name: "Adeptus Arbites Cyber-Mastiff",
    collapsible: true,
    element: (
      <CompanionsTab
        editable
        onUpdate={none}
        companions={[
          {
            id: "companion-1",
            referenceId: "ih-adeptus-arbites-cyber-mastiff",
            name: "Adeptus Arbites Cyber-Mastiff",
            source: "IH",
          },
        ]}
      />
    ),
  },
];

describe("personal notes on every owned entry", () => {
  it.each(cases)(
    "saves the note of $label to the $collection list",
    async ({ collection, id, name, collapsible, element }) => {
      const user = userEvent.setup();
      const save = vi.fn().mockResolvedValue(true);
      render(<PersonalNotesContext.Provider value={save}>{element}</PersonalNotesContext.Provider>);
      if (collapsible) openEntryCard();

      await user.click(
        screen.getByRole("button", { name: `Show information about ${name} Notes` })
      );
      await user.click(screen.getByRole("button", { name: `Edit personal notes for ${name}` }));
      await user.type(screen.getByRole("textbox", { name: "Personal Notes" }), "Mine");
      await user.click(screen.getByRole("button", { name: "Save" }));

      expect(save).toHaveBeenCalledWith(collection, id, "Mine");
    }
  );
});

describe("picker cards", () => {
  it.each([
    [
      "a Grenade",
      <GrenadeCard
        key="g"
        item={grenade}
        editable={false}
        strengthBonus={4}
        onRemove={none}
        onUpdateQty={none}
        onSelect={none}
      />,
    ],
    [
      "a Shield",
      <ShieldCard key="s" item={shield} editable={false} onRemove={none} onSelect={none} />,
    ],
    [
      "a Psychic Power",
      <PowerCard
        key="p"
        power={{ id: "p1", name: "Smite" } as PsychicPower}
        editable={false}
        onRemove={none}
        onSelect={none}
      />,
    ],
  ])("show no Notes line on %s", (_label, element) => {
    render(
      <PersonalNotesContext.Provider value={vi.fn()}>{element}</PersonalNotesContext.Provider>
    );
    openEntryCard();

    expect(screen.queryByText("Notes")).not.toBeInTheDocument();
  });
});
