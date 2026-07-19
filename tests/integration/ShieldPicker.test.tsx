// tests/integration/ShieldPicker.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { ShieldPicker } from "../../src/pages/characterSheet/weapons/ShieldPicker";
import type { CampaignCustomItem } from "../../src/types/CustomItems";

// Real reference entries (ShieldPicker has no override prop, it always reads
// SHIELD_REFERENCE directly). Both have notes, so each has its own Rules
// InfoModal titled with the bare item name, which always mounts (closed) into
// the DOM outside any row — filter for whichever match has a role="button"
// row as an ancestor.
const SHIELD_A = "Synford-Pattern \"Lockshield\"";
const SHIELD_B = "Enforcer Riot Shield";

function row(name: string): HTMLElement {
  const match = screen
    .getAllByText(name)
    .map((el) => el.closest("button"))
    .find((el): el is HTMLElement => el !== null);
  if (!match) throw new Error(`No button row found for: ${name}`);
  return match;
}

function makeCustomItem(overrides: Partial<CampaignCustomItem<"armour">> = {}): CampaignCustomItem<"armour"> {
  return {
    id: "custom-1",
    campaignId: "camp-1",
    category: "armour",
    status: "published",
    name: "Custom Buckler",
    creator: { userId: "u1" },
    latestVersionId: "v1",
    latestVersionNumber: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: { userId: "u1" },
    updatedBy: { userId: "u1" },
    data: {
      armourKind: "shield",
      name: "Custom Buckler",
      ap: 2,
      locations: "Arm",
      damage: "1d10 I",
      pen: "0",
      weight: "2 kg",
      value: "30 Thrones",
      availability: "Scarce",
    },
    ...overrides,
  };
}

function renderPicker(props: Partial<React.ComponentProps<typeof ShieldPicker>> = {}) {
  const onSelect = vi.fn();
  const onSelectCustom = vi.fn();
  const onCustom = vi.fn();
  const onClose = vi.fn();
  render(
    <ShieldPicker
      onSelect={onSelect}
      onSelectCustom={onSelectCustom}
      onCustom={onCustom}
      onClose={onClose}
      {...props}
    />
  );
  return { onSelect, onSelectCustom, onCustom, onClose };
}

describe("ShieldPicker", () => {
  it("renders shields from the reference data", () => {
    renderPicker();
    expect(row(SHIELD_A)).toBeInTheDocument();
    expect(row(SHIELD_B)).toBeInTheDocument();
  });

  it("filters the list by search query", async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.type(screen.getByPlaceholderText("Search shields…"), "Enforcer");
    expect(row(SHIELD_B)).toBeInTheDocument();
    expect(screen.queryAllByText(SHIELD_A)).toHaveLength(0);
  });

  it("shows AP, Location, Dmg, Type and Pen stats for a shield", () => {
    renderPicker();
    const lockshield = row(SHIELD_A);
    expect(within(lockshield).getByText("AP")).toBeInTheDocument();
    expect(within(lockshield).getByText("Location")).toBeInTheDocument();
    expect(within(lockshield).getByText("Dmg")).toBeInTheDocument();
    expect(within(lockshield).getByText("Type")).toBeInTheDocument();
    expect(within(lockshield).getByText("Impact")).toBeInTheDocument();
    expect(within(lockshield).getByText("Pen")).toBeInTheDocument();
  });

  it("calls onSelect with the chosen ref when a shield is clicked", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker();
    await user.click(row(SHIELD_B));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "boj-enforcer-riot-shield" }));
  });

  it("shows a View title in read-only mode and does not call onSelect on click", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker({ editable: false });
    expect(screen.getByText("View Shields")).toBeInTheDocument();
    await user.click(row(SHIELD_A));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("hides the custom-item button in read-only mode", () => {
    renderPicker({ editable: false });
    expect(screen.queryByText("+ Add custom shield")).not.toBeInTheDocument();
  });

  it("calls onCustom when '+ Add custom shield' is clicked", async () => {
    const user = userEvent.setup();
    const { onCustom } = renderPicker();
    await user.click(screen.getByText("+ Add custom shield"));
    expect(onCustom).toHaveBeenCalled();
  });

  it("shows a status badge for custom library items", () => {
    renderPicker({ customLibraryItems: [makeCustomItem({ status: "draft" })] });
    expect(row("Custom Buckler")).toBeInTheDocument();
    expect(screen.getByText("draft")).toBeInTheDocument();
  });

  it("calls onSelectCustom when a custom item is clicked", async () => {
    const user = userEvent.setup();
    const item = makeCustomItem();
    const { onSelectCustom } = renderPicker({ customLibraryItems: [item] });
    await user.click(row("Custom Buckler"));
    expect(onSelectCustom).toHaveBeenCalledWith(item);
  });
});
