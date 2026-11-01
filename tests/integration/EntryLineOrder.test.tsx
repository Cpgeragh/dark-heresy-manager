import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

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
import type { ArcheotechItem, WornArmourPiece } from "../../src/types/Character";
import { openEntryCard } from "../utils/entryCard";

const none = () => undefined;
const relic = (type: ArcheotechItem["type"]): ArcheotechItem =>
  ({ id: "x1", name: "Relic", type }) as ArcheotechItem;
const piece: WornArmourPiece = {
  id: "a1",
  name: "Flak Jacket",
  locations: ["body"],
  ap: 3,
  worn: true,
};
const forceField: WornArmourPiece = {
  ...piece,
  id: "f1",
  isForceField: true,
  protectionRating: 30,
};

const ORDER = [
  "Craftsmanship",
  "Duration",
  "Qualities",
  "Rules",
  "Mishaps",
  "Gained from",
  "Talent effects",
  "Notes",
];

const rows: [string, ReactElement][] = [
  ["a Gear item", <ItemRow key="g" item={{ id: "g1", name: "Auspex" }} editable onRemove={none} />],
  [
    "a Consumable",
    <ConsumableRow
      key="c"
      item={{ id: "c1", name: "Ration Pack", quantity: 1 }}
      editable
      onUpdateQty={none}
      onRemove={none}
    />,
  ],
  [
    "a Drug",
    <DrugRow
      key="d"
      item={{ id: "d1", name: "Frenzon", referenceId: "cr-frenzon", quantity: 1 }}
      editable
      onUpdateQty={none}
      onRemove={none}
    />,
  ],
  [
    "an Implant",
    <ImplantRow
      key="i"
      item={{ id: "y1", name: "Auto-Quill" }}
      editable
      onToggleInstalled={none}
      onRemove={none}
    />,
  ],
  [
    "an Archeotech implant",
    <ArcheotechImplantRow
      key="ai"
      item={relic("Cybernetic")}
      editable
      onToggleInstalled={none}
      onRemove={none}
    />,
  ],
  [
    "an Armour piece",
    <PieceRow key="p" piece={piece} editable worn onToggle={none} onRemove={none} />,
  ],
  [
    "a Force field",
    <ForceFieldRow key="f" piece={forceField} editable onToggle={none} onRemove={none} />,
  ],
  [
    "Archeotech armour",
    <ArcheotechArmourRow
      key="aa"
      item={relic("Armour")}
      editable
      onToggleEquip={none}
      onRemove={none}
    />,
  ],
  [
    "an Archeotech force field",
    <ArcheotechForceFieldRow
      key="af"
      item={relic("Force Field")}
      editable
      onToggleEquip={none}
      onRemove={none}
    />,
  ],
  ["an Archeotech item", <ItemCard key="ai2" item={relic("Gear")} editable onRemove={none} />],
];

describe("labelled line order on every owned entry row", () => {
  it.each(rows)("prints the lines of %s in the shared order", (_label, element) => {
    render(element);
    openEntryCard();

    const labels = screen
      .getAllByText(new RegExp(`^(${ORDER.join("|")})$`))
      .map((label) => label.textContent ?? "");
    const positions = labels.map((label) => ORDER.indexOf(label));

    expect(labels.length).toBeGreaterThan(1);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });
});
