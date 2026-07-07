// tests/integration/GrenadePicker.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { GrenadePicker } from "../../src/pages/characterSheet/weapons/GrenadePicker";
import type { CampaignCustomItem } from "../../src/types/CustomItems";

// Real reference entries (GrenadePicker has no override prop, it always reads
// GRENADE_REFERENCE directly): "Frag Grenade" is a plain grenade (type undefined,
// defaults to Grenade); "Empyrian Brain Mines" has type: "Mine" explicitly.
const GRENADE_NAME = "Frag Grenade";
const MINE_NAME = "Empyrian Brain Mines";

// Real grenades have their own Rules InfoModal titled with the bare item name,
// which always mounts its (closed) dialog into the DOM (outside any row) — so
// the name can match both the row and that hidden, button-less title. Filter
// for whichever match actually has a role="button" row as an ancestor.
function row(name: string): HTMLElement {
  const match = screen
    .getAllByText(name)
    .map((el) => el.closest('[role="button"]'))
    .find((el): el is HTMLElement => el !== null);
  if (!match) throw new Error(`No role="button" row found for: ${name}`);
  return match;
}

function makeCustomItem(overrides: Partial<CampaignCustomItem<"weapon">> = {}): CampaignCustomItem<"weapon"> {
  return {
    id: "custom-1",
    campaignId: "camp-1",
    category: "weapon",
    status: "published",
    name: "Custom Satchel Charge",
    creator: { userId: "u1" },
    latestVersionId: "v1",
    latestVersionNumber: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: { userId: "u1" },
    updatedBy: { userId: "u1" },
    data: {
      weaponKind: "grenade",
      name: "Custom Satchel Charge",
      type: "Grenade",
      damage: "3d10 X",
      pen: "0",
      weight: "2 kg",
      value: "80 Thrones",
      availability: "Rare",
    },
    ...overrides,
  };
}

function renderPicker(props: Partial<React.ComponentProps<typeof GrenadePicker>> = {}) {
  const onSelect = vi.fn();
  const onSelectCustom = vi.fn();
  const onCustom = vi.fn();
  const onClose = vi.fn();
  render(
    <GrenadePicker
      strengthBonus={4}
      onSelect={onSelect}
      onSelectCustom={onSelectCustom}
      onCustom={onCustom}
      onClose={onClose}
      {...props}
    />
  );
  return { onSelect, onSelectCustom, onCustom, onClose };
}

describe("GrenadePicker", () => {
  it("renders grenades and mines from the reference data", () => {
    renderPicker();
    expect(row(GRENADE_NAME)).toBeInTheDocument();
    expect(row(MINE_NAME)).toBeInTheDocument();
  });

  it("filters the list by search query", async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.type(screen.getByPlaceholderText("Search grenades…"), "Frag");
    expect(row(GRENADE_NAME)).toBeInTheDocument();
    expect(screen.queryAllByText(MINE_NAME)).toHaveLength(0);
  });

  it("shows a Range stat for a grenade but not for a mine", () => {
    renderPicker();
    expect(within(row(GRENADE_NAME)).getByText("Range")).toBeInTheDocument();
    expect(within(row(MINE_NAME)).queryByText("Range")).not.toBeInTheDocument();
  });

  it("shows Grenade/Thrown chips for a grenade and Mine/Exotic chips for a mine", () => {
    renderPicker();
    expect(within(row(GRENADE_NAME)).getByText("Grenade")).toBeInTheDocument();
    expect(within(row(GRENADE_NAME)).getByText("Thrown")).toBeInTheDocument();
    expect(within(row(MINE_NAME)).getByText("Mine")).toBeInTheDocument();
    expect(within(row(MINE_NAME)).getByText("Exotic")).toBeInTheDocument();
  });

  it("calls onSelect with the chosen ref when a grenade is clicked", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker();
    await user.click(row(GRENADE_NAME));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "cr-frag-grenade" }));
  });

  it("shows a View title in read-only mode and does not call onSelect on click", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker({ editable: false });
    expect(screen.getByText("View Explosives")).toBeInTheDocument();
    await user.click(row(GRENADE_NAME));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("hides the custom-item button in read-only mode", () => {
    renderPicker({ editable: false });
    expect(screen.queryByText("+ Add custom grenade or mine")).not.toBeInTheDocument();
  });

  it("calls onCustom when '+ Add custom grenade or mine' is clicked", async () => {
    const user = userEvent.setup();
    const { onCustom } = renderPicker();
    await user.click(screen.getByText("+ Add custom grenade or mine"));
    expect(onCustom).toHaveBeenCalled();
  });

  it("shows a status badge for custom library items", () => {
    renderPicker({ customLibraryItems: [makeCustomItem({ status: "draft" })] });
    expect(row("Custom Satchel Charge")).toBeInTheDocument();
    expect(screen.getByText("draft")).toBeInTheDocument();
  });

  it("calls onSelectCustom when a custom item is clicked", async () => {
    const user = userEvent.setup();
    const item = makeCustomItem();
    const { onSelectCustom } = renderPicker({ customLibraryItems: [item] });
    await user.click(row("Custom Satchel Charge"));
    expect(onSelectCustom).toHaveBeenCalledWith(item);
  });
});
