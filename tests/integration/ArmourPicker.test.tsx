// tests/integration/ArmourPicker.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { ArmourPicker } from "../../src/pages/characterSheet/ArmourTab/ArmourPicker";
import type { CampaignCustomItem } from "../../src/types/CustomItems";

const ARMOUR_A = "Flak Jacket";
const ARMOUR_B = "Carapace Helm";
const FORCE_FIELD = "Refraction Bracer";

function row(name: string): HTMLElement {
  const match = screen.getByText(name).closest("button");
  if (!match) throw new Error(`No button row found for: ${name}`);
  return match as HTMLElement;
}

function makeCustomItem(overrides: Partial<CampaignCustomItem<"armour">> = {}): CampaignCustomItem<"armour"> {
  return {
    id: "custom-1",
    campaignId: "camp-1",
    category: "armour",
    status: "published",
    name: "Custom Coat",
    creator: { userId: "u1" },
    latestVersionId: "v1",
    latestVersionNumber: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: { userId: "u1" },
    updatedBy: { userId: "u1" },
    data: {
      armourKind: "worn",
      name: "Custom Coat",
      locations: ["body"],
      ap: 3,
      weight: "5 kg",
      value: "80 Thrones",
      availability: "Average",
    },
    ...overrides,
  };
}

function renderPicker(props: Partial<React.ComponentProps<typeof ArmourPicker>> = {}) {
  const onSelect = vi.fn();
  const onSelectCustomItem = vi.fn();
  const onCustom = vi.fn();
  const onClose = vi.fn();
  render(
    <ArmourPicker
      editable={true}
      onSelect={onSelect}
      onSelectCustomItem={onSelectCustomItem}
      onCustom={onCustom}
      onClose={onClose}
      {...props}
    />
  );
  return { onSelect, onSelectCustomItem, onCustom, onClose };
}

describe("ArmourPicker list", () => {
  it("renders armour from reference data", () => {
    renderPicker();
    expect(row(ARMOUR_A)).toBeInTheDocument();
    expect(row(ARMOUR_B)).toBeInTheDocument();
  });

  it("filters the list by search query", async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.type(screen.getByPlaceholderText("Search armour..."), "Carapace Helm");
    expect(row(ARMOUR_B)).toBeInTheDocument();
    expect(screen.queryByText(ARMOUR_A)).not.toBeInTheDocument();
  });

  it("excludes force field entries", () => {
    renderPicker();
    expect(screen.queryByText(FORCE_FIELD)).not.toBeInTheDocument();
  });
});

describe("ArmourPicker craftsmanship selection", () => {
  it("opens a craftsmanship sub-screen and calls onSelect with the chosen grade", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker();
    await user.click(row(ARMOUR_A));
    await user.click(screen.getByRole("button", { name: "Best" }));
    await user.click(screen.getByRole("button", { name: "Add Armour" }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "cr-flak-jacket" }), "Best");
  });
});

describe("ArmourPicker read-only", () => {
  it("shows a View title and does not open the craftsmanship screen on click", async () => {
    const user = userEvent.setup();
    renderPicker({ editable: false });
    expect(screen.getByText("View Armour")).toBeInTheDocument();
    await user.click(row(ARMOUR_A));
    expect(screen.queryByRole("button", { name: "Add Armour" })).not.toBeInTheDocument();
  });

  it("hides the custom-piece button in read-only mode", () => {
    renderPicker({ editable: false });
    expect(screen.queryByText("+ Add custom piece")).not.toBeInTheDocument();
  });
});

describe("ArmourPicker custom pieces", () => {
  it("calls onCustom when '+ Add custom piece' is clicked", async () => {
    const user = userEvent.setup();
    const { onCustom } = renderPicker();
    await user.click(screen.getByText("+ Add custom piece"));
    expect(onCustom).toHaveBeenCalled();
  });

  it("shows a Draft badge for a draft custom item", () => {
    renderPicker({ customItems: [makeCustomItem({ status: "draft" })] });
    expect(row("Custom Coat")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });

  it("calls onSelectCustomItem when a custom piece is clicked", async () => {
    const user = userEvent.setup();
    const item = makeCustomItem();
    const { onSelectCustomItem } = renderPicker({ customItems: [item] });
    await user.click(row("Custom Coat"));
    expect(onSelectCustomItem).toHaveBeenCalledWith(item);
  });
});
