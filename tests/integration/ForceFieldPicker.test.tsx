// tests/integration/ForceFieldPicker.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { ForceFieldPicker } from "../../src/pages/characterSheet/ArmourTab/ForceFieldPicker";
import type { CampaignCustomItem } from "../../src/types/CustomItems";

const FIELD_A = "Refraction Bracer";
const FIELD_B = "Jokaerian Field";
const WORN_ARMOUR = "Flak Jacket";

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
    await user.click(screen.getByRole("button", { name: "Add custom field" }));
    expect(onCustom).toHaveBeenCalled();
  });

  it("hides the custom-field button in read-only mode", () => {
    renderPicker({ editable: false });
    expect(screen.queryByRole("button", { name: "Add custom field" })).not.toBeInTheDocument();
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

  it("shows a PR stat chip for each entry", () => {
    renderPicker();
    expect(row(FIELD_A).textContent).toContain("PR");
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
  it("shows a Draft badge for a draft custom item", () => {
    renderPicker({ customItems: [makeCustomItem({ status: "draft" })] });
    expect(row("Custom Field")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });

  it("calls onSelectCustomItem when a custom field is clicked", async () => {
    const user = userEvent.setup();
    const item = makeCustomItem();
    const { onSelectCustomItem } = renderPicker({ customItems: [item] });
    await user.click(row("Custom Field"));
    expect(onSelectCustomItem).toHaveBeenCalledWith(item);
  });
});
