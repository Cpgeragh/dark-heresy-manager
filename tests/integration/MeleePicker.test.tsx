// tests/integration/MeleePicker.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { MeleePicker } from "../../src/pages/characterSheet/weapons/MeleePicker";
import type { MeleeWeaponRef } from "../../src/data/reference/weaponReference";
import type { CampaignCustomItem } from "../../src/types/CustomItems";
import { SkillSource } from "../../src/types/SkillSource";

const references: MeleeWeaponRef[] = [
  {
    id: "ref-sword",
    name: "Sword",
    source: SkillSource.CR,
    class: "Melee",
    damage: "1d10+2 R",
    pen: 0,
    specialRules: "Balanced",
    weight: "3 kg",
    value: "100 Thrones",
    availability: "Average",
  },
  {
    id: "ref-axe",
    name: "Axe",
    source: SkillSource.CR,
    class: "Melee",
    damage: "1d10+3 R",
    pen: 0,
    specialRules: "—",
    weight: "3 kg",
    value: "50 Thrones",
    availability: "Common",
  },
];

function makeCustomItem(overrides: Partial<CampaignCustomItem<"weapon">> = {}): CampaignCustomItem<"weapon"> {
  return {
    id: "custom-1",
    campaignId: "camp-1",
    category: "weapon",
    status: "published",
    name: "Custom Cleaver",
    creator: { userId: "u1" },
    latestVersionId: "v1",
    latestVersionNumber: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: { userId: "u1" },
    updatedBy: { userId: "u1" },
    data: {
      weaponKind: "melee",
      name: "Custom Cleaver",
      class: "Melee",
      damage: "1d10+4 R",
      pen: "2",
      weight: "4 kg",
      value: "200 Thrones",
      availability: "Rare",
    },
    ...overrides,
  };
}

function renderPicker(props: Partial<React.ComponentProps<typeof MeleePicker>> = {}) {
  const onSelect = vi.fn();
  const onSelectCustomItem = vi.fn();
  const onCustom = vi.fn();
  const onClose = vi.fn();
  render(
    <MeleePicker
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

describe("MeleePicker", () => {
  it("renders every weapon in the references list", () => {
    renderPicker();
    expect(screen.getByText("Sword")).toBeInTheDocument();
    expect(screen.getByText("Axe")).toBeInTheDocument();
  });

  it("filters the list by search query", async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.type(screen.getByPlaceholderText("Search weapons…"), "Sw");
    expect(screen.getByText("Sword")).toBeInTheDocument();
    expect(screen.queryByText("Axe")).not.toBeInTheDocument();
  });

  it("shows the craftsmanship screen after selecting a weapon", async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.click(screen.getByText("Sword"));
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
    await user.click(screen.getByText("Sword"));
    await user.click(screen.getByRole("button", { name: "Best" }));
    await user.click(screen.getByRole("button", { name: "Add Weapon" }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "ref-sword" }), "Best");
  });

  it("defaults to Common craftsmanship when no selection is made", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker();
    await user.click(screen.getByText("Sword"));
    await user.click(screen.getByRole("button", { name: "Add Weapon" }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "ref-sword" }), "Common");
  });

  it("returns to the list when the back button is clicked", async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.click(screen.getByText("Sword"));
    expect(screen.getByRole("button", { name: "Add Weapon" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.getByPlaceholderText("Search weapons…")).toBeInTheDocument();
    expect(screen.getByText("Axe")).toBeInTheDocument();
  });

  it("shows a Draft badge only for draft-status custom items", () => {
    renderPicker({
      customItems: [makeCustomItem({ id: "draft-1", name: "Draft Cleaver", status: "draft" })],
    });
    expect(screen.getByText("Draft Cleaver")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText("Custom")).toBeInTheDocument();
  });

  it("doesn't show a Draft badge for published custom items", () => {
    renderPicker({ customItems: [makeCustomItem({ status: "published" })] });
    expect(screen.getByText("Custom Cleaver")).toBeInTheDocument();
    expect(screen.queryByText("Draft")).not.toBeInTheDocument();
    expect(screen.getByText("Custom")).toBeInTheDocument();
  });

  it("calls onSelectCustomItem when a custom item is clicked", async () => {
    const user = userEvent.setup();
    const item = makeCustomItem();
    const { onSelectCustomItem } = renderPicker({ customItems: [item] });
    await user.click(screen.getByText("Custom Cleaver"));
    expect(onSelectCustomItem).toHaveBeenCalledWith(item);
  });

  it("calls onCustom when '+ Add custom weapon' is clicked", async () => {
    const user = userEvent.setup();
    const { onCustom } = renderPicker();
    await user.click(screen.getByText("+ Add custom weapon"));
    expect(onCustom).toHaveBeenCalled();
  });

  it("shows a View title and hides the custom-weapon button in read-only mode", () => {
    renderPicker({ editable: false });
    expect(screen.getByText("View Melee Weapon")).toBeInTheDocument();
    expect(screen.queryByText("+ Add custom weapon")).not.toBeInTheDocument();
  });

  it("does not open the craftsmanship screen when clicking a weapon in read-only mode", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker({ editable: false });
    await user.click(screen.getByText("Sword"));
    expect(screen.queryByText("Select weapon craftsmanship:")).not.toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });
});
