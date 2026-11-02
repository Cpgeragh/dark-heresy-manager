// tests/integration/PickerPreviewCards.test.tsx
import type { ReactElement } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { OwnedEntryRow } from "../../src/ui/OwnedEntryRow";
import { ItemRow } from "../../src/pages/CharacterSheet/GearTab/ItemRow";
import { ConsumableRow } from "../../src/pages/CharacterSheet/GearTab/ConsumableRow";
import { DrugRow } from "../../src/pages/CharacterSheet/DrugsTab/DrugRow";
import { PieceRow } from "../../src/pages/CharacterSheet/ArmourTab/PieceRow";
import { ForceFieldRow } from "../../src/pages/CharacterSheet/ArmourTab/ForceFieldRow";
import { ImplantRow } from "../../src/pages/CharacterSheet/CyberneticsTab/ImplantRow";
import { ItemCard } from "../../src/pages/CharacterSheet/ArcheotechTab/ItemCard";
import { ArcheotechWeaponCard } from "../../src/pages/CharacterSheet/weapons/ArcheotechWeaponCard";
import {
  consumableFromReference,
  gearFromReference,
} from "../../src/pages/CharacterSheet/GearTab/gearSnapshotHelpers";
import { drugFromReference } from "../../src/pages/CharacterSheet/DrugsTab/drugSnapshotHelpers";
import { armourPieceFromReference } from "../../src/pages/CharacterSheet/ArmourTab/armourSnapshotHelpers";
import { cyberneticFromReference } from "../../src/pages/CharacterSheet/CyberneticsTab/cyberneticSnapshotHelpers";
import {
  ARCHEOTECH_WEAPON_TYPES,
  archeotechFromReference,
} from "../../src/pages/CharacterSheet/ArcheotechTab/archeotechSnapshotHelpers";
import { GEAR_REFERENCE } from "../../src/data/reference/gearReference";
import { CONSUMABLES_REFERENCE } from "../../src/data/reference/consumablesReference";
import { DRUGS_REFERENCE } from "../../src/data/reference/drugsReference";
import { ARMOUR_REFERENCE } from "../../src/data/reference/armourReference";
import { CYBERNETICS_REFERENCE } from "../../src/data/reference/cyberneticsReference";
import { ARCHEOTECH_REFERENCE } from "../../src/data/reference/archeotechReference";
import type { CampaignCustomItem } from "../../src/types/CustomItems";

const noop = () => {};

const gear = GEAR_REFERENCE.find((ref) => ref.name === "Backpack")!;
const variableGear = GEAR_REFERENCE.find((ref) => ref.name === "Cilice")!;
const consumable = CONSUMABLES_REFERENCE.find((ref) => ref.name === "Amasec")!;
const drug = DRUGS_REFERENCE.find((ref) => ref.name === "Frenzon")!;
const armour = ARMOUR_REFERENCE.find((ref) => ref.id === "cr-flak-jacket")!;
const forceField = ARMOUR_REFERENCE.find((ref) => ref.id === "dh-refraction-bracer")!;
const implant = CYBERNETICS_REFERENCE.find((ref) => ref.name === "Auger Arrays")!;
const archeotechWeapon = ARCHEOTECH_REFERENCE.find((ref) => ref.type === "Grenade")!;
const archeotechOther = ARCHEOTECH_REFERENCE.find(
  (ref) => !ARCHEOTECH_WEAPON_TYPES.includes(ref.type)
)!;
const variableArcheotech = ARCHEOTECH_REFERENCE.find((ref) => ref.name === "Holo-Clone")!;
const variableArcheotechWeapon = ARCHEOTECH_REFERENCE.find(
  (ref) => ref.name === "Midath-Pattern Power Glove"
)!;
const variableImplant = CYBERNETICS_REFERENCE.find((ref) => ref.name === "Electro-Graft")!;

describe("OwnedEntryRow in a picker", () => {
  function renderPreview(onSelect = vi.fn()) {
    const onRemove = vi.fn();
    render(
      <OwnedEntryRow
        name="Test Item"
        editable
        preview
        onSelect={onSelect}
        chips={<span>Chip text</span>}
        actions={<button type="button">Do it</button>}
        body={<p>Body text</p>}
        library={{ libraryItem: { status: "draft" } as CampaignCustomItem<"gear"> }}
        removal={{ kind: "Gear Item", onRemove }}
      />
    );
    return { onSelect, onRemove };
  }

  it("starts closed with no Remove button, action or body", () => {
    renderPreview();
    expect(screen.getByText("Test Item")).toBeInTheDocument();
    expect(screen.queryByText("Chip text")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Do it" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /remove/i })).not.toBeInTheDocument();
  });

  it("chooses on a header tap and opens on the chevron, showing the chips but not the body", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPreview();

    await user.click(screen.getByRole("button", { name: "Expand Test Item details" }));
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByText("Chip text")).toBeInTheDocument();
    expect(screen.queryByText("Body text")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Select Test Item" }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("still shows the status word of a custom item", () => {
    renderPreview();
    expect(screen.getByText("draft")).toBeInTheDocument();
  });
});

describe("owned cards in a picker", () => {
  const cards: { name: string; element: (onSelect: () => void) => ReactElement }[] = [
    {
      name: gear.name,
      element: (onSelect) => (
        <ItemRow
          item={gearFromReference("picker-gear", gear)}
          editable={false}
          preview
          onSelect={onSelect}
          onRemove={noop}
        />
      ),
    },
    {
      name: consumable.name,
      element: (onSelect) => (
        <ConsumableRow
          item={consumableFromReference("picker-consumable", consumable)}
          editable={false}
          preview
          onSelect={onSelect}
          onUpdateQty={noop}
          onRemove={noop}
        />
      ),
    },
    {
      name: drug.name,
      element: (onSelect) => (
        <DrugRow
          item={drugFromReference("picker-drug", drug)}
          editable={false}
          preview
          onSelect={onSelect}
          onUpdateQty={noop}
          onRemove={noop}
        />
      ),
    },
    {
      name: armour.name,
      element: (onSelect) => (
        <PieceRow
          piece={armourPieceFromReference("picker-armour", armour)}
          editable={false}
          worn
          preview
          onSelect={onSelect}
          onToggle={noop}
          onRemove={noop}
          onAddUpgrade={noop}
          onRemoveUpgrade={noop}
        />
      ),
    },
    {
      name: forceField.name,
      element: (onSelect) => (
        <ForceFieldRow
          piece={armourPieceFromReference("picker-field", forceField)}
          editable={false}
          preview
          onSelect={onSelect}
          onToggle={noop}
          onRemove={noop}
          onUpdateSpareCells={noop}
        />
      ),
    },
    {
      name: implant.name,
      element: (onSelect) => (
        <ImplantRow
          item={cyberneticFromReference("picker-implant", implant)}
          editable={false}
          preview
          onSelect={onSelect}
          onToggleInstalled={noop}
          onRemove={noop}
        />
      ),
    },
    {
      name: archeotechOther.name,
      element: (onSelect) => (
        <ItemCard
          item={archeotechFromReference("picker-relic", archeotechOther)}
          editable={false}
          preview
          onSelect={onSelect}
          onRemove={noop}
        />
      ),
    },
    {
      name: archeotechWeapon.name,
      element: (onSelect) => (
        <ArcheotechWeaponCard
          item={archeotechFromReference("picker-weapon", archeotechWeapon)}
          highlightAsArcheotech={false}
          preview
          onSelect={onSelect}
        />
      ),
    },
  ];

  it.each(cards)(
    "draws $name as a closed card that a header tap chooses and the chevron opens",
    async ({ name, element }) => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(element(onSelect));

      expect(screen.queryByRole("button", { name: `Collapse ${name} details` })).toBeNull();
      expect(screen.queryByRole("button", { name: /remove/i })).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", {
          name: /^(Equip|Unequip|Wear|Stow|Activate|Deactivate|Install|Uninstall)$/,
        })
      ).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: `Expand ${name} details` }));
      expect(onSelect).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: `Collapse ${name} details` })).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: `Select ${name}` }));
      expect(onSelect).toHaveBeenCalledTimes(1);
    }
  );

  it("shows a picker-only note inside the opened card", async () => {
    const user = userEvent.setup();
    render(
      <ItemRow
        item={gearFromReference("picker-gear", gear)}
        editable={false}
        preview
        previewNote={<span>Cost assigned on add</span>}
        onSelect={noop}
        onRemove={noop}
      />
    );

    expect(screen.queryByText("Cost assigned on add")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: `Expand ${gear.name} details` }));
    expect(screen.getByText("Cost assigned on add")).toBeInTheDocument();
  });

  it("shows the status word of a custom item and none of its library buttons", () => {
    render(
      <ItemRow
        item={gearFromReference("picker-gear", gear)}
        editable={false}
        libraryItem={{ status: "published" } as CampaignCustomItem<"gear">}
        preview
        onSelect={noop}
        onRemove={noop}
      />
    );
    expect(screen.getByText("published")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /publish|archive|edit definition/i })).toBeNull();
  });

  it("shows the status word of a custom Archeotech weapon on its card", () => {
    render(
      <ArcheotechWeaponCard
        item={archeotechFromReference("picker-weapon", archeotechWeapon)}
        libraryItem={{ status: "draft" } as CampaignCustomItem<"archeotech">}
        highlightAsArcheotech={false}
        preview
        onSelect={noop}
      />
    );
    expect(screen.getByText("draft")).toBeInTheDocument();
  });

  it("keeps the Remove button on the same card outside a picker", () => {
    render(<ItemRow item={gearFromReference("owned-gear", gear)} editable onRemove={noop} />);
    expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument();
  });
});

describe("a cost assigned on add in a picker", () => {
  it("shows Varies on a Gear card, and the owned card shows the stored cost", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <ItemRow
        item={gearFromReference("picker-gear", variableGear, { weight: "1 kg" })}
        editable={false}
        preview
        onSelect={noop}
        onRemove={noop}
      />
    );
    await user.click(screen.getByRole("button", { name: `Expand ${variableGear.name} details` }));
    expect(screen.getByText("Varies")).toBeInTheDocument();
    expect(screen.queryByText(/₮/)).not.toBeInTheDocument();
    unmount();

    render(
      <ItemRow
        item={gearFromReference("owned-gear", variableGear, {
          value: "500 Thrones",
          weight: "1 kg",
        })}
        editable={false}
        onRemove={noop}
      />
    );
    await user.click(screen.getByRole("button", { name: `Expand ${variableGear.name} details` }));
    expect(screen.getByText("₮ 500")).toBeInTheDocument();
    expect(screen.queryByText("Varies")).not.toBeInTheDocument();
  });

  it("shows Varies on an Implant card", async () => {
    const user = userEvent.setup();
    render(
      <ImplantRow
        item={cyberneticFromReference("picker-implant", variableImplant)}
        editable={false}
        preview
        onSelect={noop}
        onToggleInstalled={noop}
        onRemove={noop}
      />
    );
    await user.click(
      screen.getByRole("button", { name: `Expand ${variableImplant.name} details` })
    );
    expect(screen.getByText("Varies")).toBeInTheDocument();
    expect(screen.queryByText(/₮/)).not.toBeInTheDocument();
  });

  it("shows Varies on an Archeotech item card and on an Archeotech weapon card", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <ItemCard
        item={archeotechFromReference("picker-device", variableArcheotech)}
        editable={false}
        preview
        onSelect={noop}
        onRemove={noop}
      />
    );
    await user.click(
      screen.getByRole("button", { name: `Expand ${variableArcheotech.name} details` })
    );
    expect(screen.getAllByText("Varies").length).toBeGreaterThan(0);
    expect(screen.queryByText(/₮/)).not.toBeInTheDocument();
    unmount();

    render(
      <ArcheotechWeaponCard
        item={archeotechFromReference("picker-glove", variableArcheotechWeapon)}
        highlightAsArcheotech={false}
        preview
        onSelect={noop}
      />
    );
    await user.click(
      screen.getByRole("button", { name: `Expand ${variableArcheotechWeapon.name} details` })
    );
    expect(screen.getAllByText("Varies").length).toBeGreaterThan(0);
    expect(screen.queryByText(/₮/)).not.toBeInTheDocument();
  });
});
