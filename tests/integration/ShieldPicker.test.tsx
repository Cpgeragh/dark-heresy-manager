// tests/integration/ShieldPicker.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { ShieldPicker } from "../../src/pages/CharacterSheet/weapons/ShieldPicker";
import type { CampaignCustomItem } from "../../src/types/CustomItems";

// Real reference entries (ShieldPicker has no override prop, it always reads
// SHIELD_REFERENCE directly).
const SHIELD_A = 'Synford-Pattern "Lockshield"';
const SHIELD_B = "Enforcer Riot Shield";

function selectButton(name: string): HTMLElement {
  return screen.getByRole("button", { name: `Select ${name}` });
}

async function expand(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole("button", { name: `Expand ${name} details` }));
}

function makeCustomItem(
  overrides: Partial<CampaignCustomItem<"armour">> = {}
): CampaignCustomItem<"armour"> {
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
    expect(selectButton(SHIELD_A)).toBeInTheDocument();
    expect(selectButton(SHIELD_B)).toBeInTheDocument();
  });

  it("filters the list by search query", async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.type(screen.getByPlaceholderText("Search shields…"), "Enforcer");
    expect(selectButton(SHIELD_B)).toBeInTheDocument();
    expect(screen.queryAllByText(SHIELD_A)).toHaveLength(0);
  });

  it("starts closed and shows the stats, Qualities, and Rules lines once opened", async () => {
    const user = userEvent.setup();
    renderPicker();
    expect(screen.queryByText("AP")).not.toBeInTheDocument();
    await expand(user, SHIELD_A);
    expect(screen.getByText("AP")).toBeInTheDocument();
    expect(screen.getByText("Location")).toBeInTheDocument();
    expect(screen.getByText("Damage")).toBeInTheDocument();
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Impact")).toBeInTheDocument();
    expect(screen.getByText("Pen")).toBeInTheDocument();
    expect(screen.getByText("Qualities")).toBeInTheDocument();
    expect(screen.getByText("Rules")).toBeInTheDocument();
  });

  it("shows the Shield chip on a closed card", () => {
    renderPicker();
    const card = selectButton(SHIELD_A).parentElement as HTMLElement;
    expect(within(card).getByText("Shield")).toBeInTheDocument();
  });

  it("calls onSelect with the chosen ref when a shield is tapped", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker();
    await user.click(selectButton(SHIELD_B));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "boj-enforcer-riot-shield" })
    );
  });

  it("opens a shield without choosing it when the chevron is pressed", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker();
    await expand(user, SHIELD_B);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("shows a View title in read-only mode and does not call onSelect on tap", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker({ editable: false });
    expect(screen.getByText("View Shields")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: `Select ${SHIELD_A}` })).not.toBeInTheDocument();
    await expand(user, SHIELD_A);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("hides the custom-item button in read-only mode", () => {
    renderPicker({ editable: false });
    expect(screen.queryByRole("button", { name: "Add custom shield" })).not.toBeInTheDocument();
  });

  it("calls onCustom when the custom-shield button is clicked", async () => {
    const user = userEvent.setup();
    const { onCustom } = renderPicker();
    await user.click(screen.getByRole("button", { name: "Add custom shield" }));
    expect(onCustom).toHaveBeenCalled();
  });

  it("shows a status badge for custom library items", () => {
    renderPicker({ customLibraryItems: [makeCustomItem({ status: "draft" })] });
    expect(selectButton("Custom Buckler")).toBeInTheDocument();
    expect(screen.getByText("draft")).toBeInTheDocument();
  });

  it("calls onSelectCustom when a custom item is tapped", async () => {
    const user = userEvent.setup();
    const item = makeCustomItem();
    const { onSelectCustom } = renderPicker({ customLibraryItems: [item] });
    await user.click(selectButton("Custom Buckler"));
    expect(onSelectCustom).toHaveBeenCalledWith(item);
  });
});
