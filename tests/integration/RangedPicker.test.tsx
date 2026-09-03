// tests/integration/RangedPicker.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { RangedPicker } from "../../src/pages/CharacterSheet/weapons/RangedPicker";
import type { RangedWeaponRef } from "../../src/data/reference/weaponReference";
import type { CampaignCustomItem } from "../../src/types/CustomItems";
import { SkillSource } from "../../src/types/SkillSource";

const references: RangedWeaponRef[] = [
  {
    id: "ref-lasgun",
    name: "Lasgun",
    source: SkillSource.CR,
    class: "Basic",
    range: "100m",
    rof: "S/-/3",
    damage: "1d10+3 E",
    pen: 0,
    clip: 60,
    reload: "Full",
    specialRules: "Reliable",
    weight: "4 kg",
    value: "50 Thrones",
    availability: "Abundant",
    ammoType: "Las",
  },
  {
    id: "ref-autopistol",
    name: "Autopistol",
    source: SkillSource.CR,
    class: "Pistol",
    range: "30m",
    rof: "S/2/-",
    damage: "1d10 I",
    pen: 0,
    clip: 18,
    reload: "Full",
    specialRules: "—",
    weight: "1.5 kg",
    value: "50 Thrones",
    availability: "Plentiful",
    ammoType: "Solid Projectile",
  },
  {
    id: "ref-heavy-bolter",
    name: "Heavy Bolter",
    source: SkillSource.CR,
    class: "Heavy",
    range: "150m",
    rof: "-/-/6",
    damage: "2d10+8 X",
    pen: 5,
    clip: 60,
    reload: "Full",
    specialRules: "Tearing",
    weight: "22 kg",
    value: "1500 Thrones",
    availability: "Extremely Rare",
    ammoType: "Bolt",
  },
];

function makeCustomItem(overrides: Partial<CampaignCustomItem<"weapon">> = {}): CampaignCustomItem<"weapon"> {
  return {
    id: "custom-1",
    campaignId: "camp-1",
    category: "weapon",
    status: "published",
    name: "Custom Blaster",
    creator: { userId: "u1" },
    latestVersionId: "v1",
    latestVersionNumber: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: { userId: "u1" },
    updatedBy: { userId: "u1" },
    data: {
      weaponKind: "ranged",
      name: "Custom Blaster",
      class: "Pistol",
      range: "30m",
      rof: "S/2/-",
      damage: "1d10+2 E",
      pen: "3",
      clip: "20",
      weight: "1.5 kg",
      value: "500 Thrones",
      availability: "Rare",
      ammoType: "Plasma",
    },
    ...overrides,
  };
}

function renderPicker(props: Partial<React.ComponentProps<typeof RangedPicker>> = {}) {
  const onSelect = vi.fn();
  const onSelectCustomItem = vi.fn();
  const onCustom = vi.fn();
  const onClose = vi.fn();
  render(
    <RangedPicker
      references={references}
      onSelect={onSelect}
      onSelectCustomItem={onSelectCustomItem}
      onCustom={onCustom}
      onClose={onClose}
      {...props}
    />
  );
  return { onSelect, onSelectCustomItem, onCustom, onClose };
}

describe("RangedPicker", () => {
  it("renders every weapon in the references list", () => {
    renderPicker();
    expect(screen.getByText("Lasgun")).toBeInTheDocument();
    expect(screen.getByText("Autopistol")).toBeInTheDocument();
    expect(screen.getByText("Heavy Bolter")).toBeInTheDocument();
  });

  it("filters the list by search query", async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.type(screen.getByPlaceholderText("Search weapons…"), "Las");
    expect(screen.getByText("Lasgun")).toBeInTheDocument();
    expect(screen.queryByText("Autopistol")).not.toBeInTheDocument();
    expect(screen.queryByText("Heavy Bolter")).not.toBeInTheDocument();
  });

  it("filters the list by weapon class", async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.click(screen.getByText("All Classes"));
    await user.click(screen.getByText("Pistol"));
    expect(screen.getByText("Autopistol")).toBeInTheDocument();
    expect(screen.queryByText("Lasgun")).not.toBeInTheDocument();
    expect(screen.queryByText("Heavy Bolter")).not.toBeInTheDocument();
  });

  it("filters the list by ammo family", async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.click(screen.getByText("All Types"));
    await user.click(screen.getByText("Bolt"));
    expect(screen.getByText("Heavy Bolter")).toBeInTheDocument();
    expect(screen.queryByText("Lasgun")).not.toBeInTheDocument();
    expect(screen.queryByText("Autopistol")).not.toBeInTheDocument();
  });

  it("shows the craftsmanship screen after selecting a weapon", async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.click(screen.getByRole("button", { name: "Select Lasgun" }));
    expect(screen.getByText("Select weapon craftsmanship:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Poor" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Common" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Good" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Best" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Weapon" })).toBeInTheDocument();
  });

  it("calls onSelect with the chosen ref and craftsmanship", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker();
    await user.click(screen.getByRole("button", { name: "Select Lasgun" }));
    await user.click(screen.getByRole("button", { name: "Good" }));
    await user.click(screen.getByRole("button", { name: "Add Weapon" }));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "ref-lasgun" }),
      "Good"
    );
  });

  it("defaults to Common craftsmanship when no selection is made", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker();
    await user.click(screen.getByRole("button", { name: "Select Lasgun" }));
    await user.click(screen.getByRole("button", { name: "Add Weapon" }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "ref-lasgun" }), "Common");
  });

  it("returns to the list when the back button is clicked", async () => {
    const user = userEvent.setup();
    renderPicker();
    const list = screen
      .getByRole("dialog", { name: "Add Ranged Weapon" })
      .querySelector<HTMLElement>(".overflow-y-auto");
    if (!list) throw new Error("No Ranged picker scroll container found");
    list.scrollTop = 175;
    fireEvent.scroll(list);
    await user.click(screen.getByRole("button", { name: "Select Lasgun" }));
    expect(screen.getByRole("button", { name: "Add Weapon" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByPlaceholderText("Search weapons…")).toBeInTheDocument();
    expect(screen.getByText("Autopistol")).toBeInTheDocument();
    expect(
      screen
        .getByRole("dialog", { name: "Add Ranged Weapon" })
        .querySelector<HTMLElement>(".overflow-y-auto")?.scrollTop
    ).toBe(175);
  });

  it("shows a Draft badge only for draft-status custom items", () => {
    renderPicker({
      customItems: [
        makeCustomItem({ id: "draft-1", name: "Draft Blaster", status: "draft" }),
      ],
    });
    expect(screen.getByText("Draft Blaster")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText("Custom")).toBeInTheDocument();
  });

  it("doesn't show a Draft badge for published custom items", () => {
    renderPicker({ customItems: [makeCustomItem({ status: "published" })] });
    expect(screen.getByText("Custom Blaster")).toBeInTheDocument();
    expect(screen.queryByText("Draft")).not.toBeInTheDocument();
    expect(screen.getByText("Custom")).toBeInTheDocument();
  });

  it("calls onSelectCustomItem when a custom item is clicked", async () => {
    const user = userEvent.setup();
    const item = makeCustomItem();
    const { onSelectCustomItem } = renderPicker({ customItems: [item] });
    await user.click(screen.getByText("Custom Blaster"));
    expect(onSelectCustomItem).toHaveBeenCalledWith(item);
  });

  it("calls onCustom when the custom-weapon button is clicked", async () => {
    const user = userEvent.setup();
    const { onCustom } = renderPicker();
    await user.click(screen.getByRole("button", { name: "Add custom weapon" }));
    expect(onCustom).toHaveBeenCalled();
  });

  it("shows a View title and hides the custom-weapon button in read-only mode", () => {
    renderPicker({ editable: false });
    expect(screen.getByText("View Ranged Weapons")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add custom weapon" })).not.toBeInTheDocument();
  });

  it("does not open the craftsmanship screen when clicking a weapon in read-only mode", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker({ editable: false });
    await user.click(screen.getByRole("button", { name: "Expand Lasgun details" }));
    expect(screen.queryByText("Select weapon craftsmanship:")).not.toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });
});
