// tests/integration/IntegratedWeaponPicker.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { IntegratedWeaponPicker } from "../../src/pages/CharacterSheet/weapons/IntegratedWeaponPicker";
import {
  INTEGRATED_RANGED_REFS,
  INTEGRATED_MELEE_REFS,
} from "../../src/pages/CharacterSheet/weapons/weaponHelpers";
import type { CampaignCustomItem } from "../../src/types/CustomItems";

function selectButton(name: string): HTMLElement {
  return screen.getByRole("button", { name: `Select ${name}` });
}

function renderPicker(
  customItems: CampaignCustomItem<"weapon">[] = [],
  props: Partial<React.ComponentProps<typeof IntegratedWeaponPicker>> = {}
) {
  const onSelectRanged = vi.fn();
  const onSelectMelee = vi.fn();
  const onSelectCustomItem = vi.fn();
  const onClose = vi.fn();
  render(
    <IntegratedWeaponPicker
      onSelectRanged={onSelectRanged}
      onSelectMelee={onSelectMelee}
      customItems={customItems}
      onSelectCustomItem={onSelectCustomItem}
      onClose={onClose}
      {...props}
    />
  );
  return { onSelectRanged, onSelectMelee, onSelectCustomItem, onClose };
}

describe("IntegratedWeaponPicker craftsmanship description", () => {
  it("shows the ranged-specific description for an integrated ranged weapon", async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.click(selectButton(INTEGRATED_RANGED_REFS[0].name));
    expect(
      screen.getByText(
        /ranged weapon has the Unreliable quality|ranged weapons are more reliable|never suffer from jamming|no additional modifier/
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/incur a -10 penalty to Tests made to attack/)
    ).not.toBeInTheDocument();
  });

  it("shows the melee-specific description for an integrated melee weapon", async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.click(selectButton(INTEGRATED_MELEE_REFS[0].name));
    expect(
      screen.getByText(/Common craftsmanship melee weapons have no additional modifier/)
    ).toBeInTheDocument();
  });

  it("updates the description when a different craftsmanship level is picked", async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.click(selectButton(INTEGRATED_MELEE_REFS[0].name));
    await user.click(screen.getByRole("button", { name: "Best" }));
    expect(
      screen.getByText(/add a \+10 bonus to Tests made to attack and add 1 to the Damage/)
    ).toBeInTheDocument();
  });

  it("lists published custom integrated weapons alphabetically and selects them directly", async () => {
    const user = userEvent.setup();
    const customItem = {
      id: "custom-integrated-ranged",
      campaignId: "campaign-1",
      category: "weapon",
      status: "published",
      name: "Aardvark Blaster",
      creator: { userId: "user-1" },
      createdBy: { userId: "user-1" },
      updatedBy: { userId: "user-1" },
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedVersionId: "version-1",
      latestVersionId: "version-1",
      latestVersionNumber: 1,
      data: {
        weaponKind: "ranged",
        integrated: true,
        name: "Aardvark Blaster",
        class: "Pistol",
        range: "30m",
        rof: "S/–/–",
        damage: "1d10",
        pen: "0",
        clip: "6",
        rld: "Full",
        specialRules: "—",
      },
    } as unknown as CampaignCustomItem<"weapon">;
    const { onSelectCustomItem } = renderPicker([customItem]);

    const customCard = selectButton(customItem.name);
    expect(
      customCard.compareDocumentPosition(selectButton(INTEGRATED_RANGED_REFS[0].name)) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    await user.click(customCard);
    expect(onSelectCustomItem).toHaveBeenCalledWith(customItem);
  });
});

describe("IntegratedWeaponPicker cards", () => {
  it("shows an Integrated chip on a ranged and a melee card", () => {
    renderPicker();
    const rangedCard = selectButton(INTEGRATED_RANGED_REFS[0].name).parentElement as HTMLElement;
    const meleeCard = selectButton(INTEGRATED_MELEE_REFS[0].name).parentElement as HTMLElement;
    expect(rangedCard).toHaveTextContent("Integrated");
    expect(meleeCard).toHaveTextContent("Integrated");
  });

  it("opens an integrated weapon without choosing it when the chevron is pressed", async () => {
    const user = userEvent.setup();
    renderPicker();
    const name = INTEGRATED_MELEE_REFS[0].name;
    await user.click(screen.getByRole("button", { name: `Expand ${name} details` }));
    expect(screen.queryByText("Select weapon craftsmanship:")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: `Collapse ${name} details` })).toBeInTheDocument();
  });

  it("uses the given Strength bonus for an opened melee card's total", async () => {
    const user = userEvent.setup();
    renderPicker([], { strengthBonus: 7 });
    const name = INTEGRATED_MELEE_REFS[0].name;
    await user.click(screen.getByRole("button", { name: `Expand ${name} details` }));
    expect(screen.getByText("+7")).toBeInTheDocument();
  });
});
