// tests/integration/ForceFieldPicker.test.tsx
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { ForceFieldPicker } from "../../src/pages/CharacterSheet/ArmourTab/ForceFieldPicker";
import type { CampaignCustomItem } from "../../src/types/CustomItems";

const FIELD_A = "Refraction Bracer";
const FIELD_B = "Jokaerian Field";
const WORN_ARMOUR = "Flak Jacket";

function row(name: string): HTMLButtonElement {
  return (screen.queryByRole("button", { name: `Select ${name}` }) ??
    screen.getByRole("button", { name: `Expand ${name} details` })) as HTMLButtonElement;
}

function makeCustomItem(
  overrides: Partial<CampaignCustomItem<"armour">> = {}
): CampaignCustomItem<"armour"> {
  return {
    id: "custom-1",
    campaignId: "camp-1",
    category: "armour",
    status: "published",
    name: "Custom Field",
    creator: { userId: "u1" },
    latestVersionId: "v1",
    latestVersionNumber: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: { userId: "u1" },
    updatedBy: { userId: "u1" },
    data: {
      armourKind: "worn",
      name: "Custom Field",
      locations: [],
      ap: 0,
      isForceField: true,
      protectionRating: 40,
      weight: "0.5 kg",
      value: "10,000 Thrones",
      availability: "Rare",
    },
    ...overrides,
  };
}

function renderPicker(props: Partial<React.ComponentProps<typeof ForceFieldPicker>> = {}) {
  const onSelect = vi.fn();
  const onSelectCustomItem = vi.fn();
  const onCustom = vi.fn();
  const onClose = vi.fn();
  render(
    <ForceFieldPicker
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

describe("ForceFieldPicker custom creation", () => {
  it("calls onCustom when the custom-field button is clicked", async () => {
    const user = userEvent.setup();
    const { onCustom } = renderPicker();
    await user.click(screen.getByRole("button", { name: "Add Custom Force Field" }));
    expect(onCustom).toHaveBeenCalled();
  });

  it("hides the custom-field button in read-only mode", () => {
    renderPicker({ editable: false });
    expect(
      screen.queryByRole("button", { name: "Add Custom Force Field" })
    ).not.toBeInTheDocument();
  });
});

describe("ForceFieldPicker list", () => {
  it("renders force fields from reference data", () => {
    renderPicker();
    expect(row(FIELD_A)).toBeInTheDocument();
    expect(row(FIELD_B)).toBeInTheDocument();
  });

  it("filters the list by search query", async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.type(screen.getByPlaceholderText("Search force fields..."), "Jokaerian");
    expect(row(FIELD_B)).toBeInTheDocument();
    expect(screen.queryByText(FIELD_A)).not.toBeInTheDocument();
  });

  it("excludes worn armour entries", () => {
    renderPicker();
    expect(screen.queryByText(WORN_ARMOUR)).not.toBeInTheDocument();
  });

  it("shows a PR stat chip once the card is opened", () => {
    renderPicker();
    fireEvent.click(screen.getByRole("button", { name: `Expand ${FIELD_A} details` }));
    expect(screen.getByText("PR")).toBeInTheDocument();
  });

  it("hides the Craftsmanship line on a reference card until one is chosen", () => {
    renderPicker();
    fireEvent.click(screen.getByRole("button", { name: `Expand ${FIELD_A} details` }));
    expect(screen.getByText("Rules")).toBeInTheDocument();
    expect(screen.queryByText("Craftsmanship")).not.toBeInTheDocument();
  });

  it("shows the stored Craftsmanship line on a custom card", () => {
    renderPicker({
      customItems: [
        makeCustomItem({
          data: {
            armourKind: "worn",
            name: "Custom Field",
            locations: [],
            ap: 0,
            isForceField: true,
            protectionRating: 40,
            craftsmanship: "Good",
          },
        }),
      ],
    });
    fireEvent.click(screen.getByRole("button", { name: "Expand Custom Field details" }));
    expect(screen.getByText("Craftsmanship")).toBeInTheDocument();
    expect(screen.getByText("Good")).toBeInTheDocument();
  });
});

describe("ForceFieldPicker craftsmanship selection", () => {
  it("opens a craftsmanship sub-screen and calls onSelect with the chosen grade", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker();
    await user.click(row(FIELD_A));
    await user.click(screen.getByRole("button", { name: "Poor" }));
    await user.click(screen.getByRole("button", { name: "Add Force Field" }));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "dh-refraction-bracer" }),
      "Poor"
    );
  });

  it("returns to the list with the Close cross, not a Back arrow", async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.click(row(FIELD_A));
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(row(FIELD_B)).toBeInTheDocument();
  });
});

describe("ForceFieldPicker read-only", () => {
  it("shows a View title and does not open the craftsmanship screen on click", async () => {
    const user = userEvent.setup();
    renderPicker({ editable: false });
    expect(screen.getByText("View Force Fields")).toBeInTheDocument();
    await user.click(row(FIELD_A));
    expect(screen.queryByRole("button", { name: "Add Force Field" })).not.toBeInTheDocument();
  });
});

describe("ForceFieldPicker custom fields", () => {
  it("shows the draft status badge for a draft custom item and no Custom chip", () => {
    renderPicker({ customItems: [makeCustomItem({ status: "draft" })] });
    expect(row("Custom Field")).toBeInTheDocument();
    expect(screen.getByText("draft")).toBeInTheDocument();
    expect(screen.queryByText("Custom")).not.toBeInTheDocument();
  });

  it("shows the information icon in the header of a custom card and a reference card, with no arrow", () => {
    renderPicker({ customItems: [makeCustomItem()] });
    expect(
      screen.getByRole("button", { name: "Show information about Custom Field" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: `Show information about ${FIELD_A}` })
    ).toBeInTheDocument();
    expect(document.querySelector("[data-picker-arrow]")).toBeNull();
  });

  it("calls onSelectCustomItem when a custom field is clicked", async () => {
    const user = userEvent.setup();
    const item = makeCustomItem();
    const { onSelectCustomItem } = renderPicker({ customItems: [item] });
    await user.click(row("Custom Field"));
    expect(onSelectCustomItem).toHaveBeenCalledWith(item);
  });
});
