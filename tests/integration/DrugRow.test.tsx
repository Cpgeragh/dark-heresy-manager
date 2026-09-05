// tests/integration/DrugRow.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { DrugRow } from "../../src/pages/CharacterSheet/DrugsTab/DrugRow";
import type { DrugItem } from "../../src/types/Character";
import type { CampaignCustomItem } from "../../src/types/CustomItems";

// Real reference entry (src/data/reference/drugsReference.ts), used to exercise
// the info-modal effect/side-effect content genuinely, not fabricated.
const OBSCURA_REF_ID = "cr-obscura";

function item(over: Partial<DrugItem> = {}): DrugItem {
  return { id: "d1", name: "Obscura", quantity: 1, ...over };
}

describe("DrugRow", () => {
  it("renders the item name", () => {
    render(<DrugRow item={item()} editable={true} onUpdateQty={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByText("Obscura")).toBeInTheDocument();
  });

  it("shows a status badge when linked to a campaign library item", () => {
    const libraryItem = { status: "draft" } as CampaignCustomItem<"drug">;
    render(
      <DrugRow
        item={item()}
        libraryItem={libraryItem}
        editable={true}
        onUpdateQty={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByText(/draft/i)).toBeInTheDocument();
  });

  it("shows real effect/duration/side-effect text from the reference data via the info modal", async () => {
    const user = userEvent.setup();
    render(
      <DrugRow
        item={item({ referenceId: OBSCURA_REF_ID })}
        editable={true}
        onUpdateQty={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /information/i }));
    expect(screen.getByText(/dream-like state/)).toBeInTheDocument();
  });

  it("wires the quantity control", async () => {
    const user = userEvent.setup();
    const onUpdateQty = vi.fn();
    render(
      <DrugRow
        item={item({ quantity: 2 })}
        editable={true}
        onUpdateQty={onUpdateQty}
        onRemove={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Increase quantity" }));
    expect(onUpdateQty).toHaveBeenCalledWith("d1", 3);
  });

  it("calls onRemove", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<DrugRow item={item()} editable={true} onUpdateQty={vi.fn()} onRemove={onRemove} />);

    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalledWith("d1");
  });

  it("hides the quantity and remove controls when not editable", () => {
    render(<DrugRow item={item()} editable={false} onUpdateQty={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Increase quantity" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  });
});
