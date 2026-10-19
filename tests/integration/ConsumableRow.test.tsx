// tests/integration/ConsumableRow.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { ConsumableRow } from "../../src/pages/CharacterSheet/GearTab/ConsumableRow";
import type { ConsumableItem } from "../../src/types/Character";
import type { CampaignCustomItem } from "../../src/types/CustomItems";

function item(over: Partial<ConsumableItem> = {}): ConsumableItem {
  return { id: "c1", name: "Stimm", quantity: 1, ...over };
}

describe("ConsumableRow", () => {
  it("puts the quantity control on the right with no Qty label, after the Remove button", () => {
    render(
      <ConsumableRow item={item()} editable={true} onUpdateQty={vi.fn()} onRemove={vi.fn()} />
    );

    expect(screen.queryByText("Qty")).not.toBeInTheDocument();
    const remove = screen.getByRole("button", { name: "Remove Stimm" });
    const increase = screen.getByRole("button", { name: "Increase quantity" });
    expect(
      remove.compareDocumentPosition(increase) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("always shows a Rules line, with the rules behind it when the item has them", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ConsumableRow item={item()} editable={true} onUpdateQty={vi.fn()} onRemove={vi.fn()} />
    );
    expect(screen.getByText("Rules")).toBeInTheDocument();
    expect(screen.getByText("-")).toBeInTheDocument();

    rerender(
      <ConsumableRow
        item={item({ rules: "Heals 1d5 Wounds." })}
        editable={true}
        onUpdateQty={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    await user.click(screen.getByRole("button", { name: "Show information about Stimm Rules" }));
    expect(screen.getByText("Heals 1d5 Wounds.")).toBeInTheDocument();
  });

  it("renders the item name", () => {
    render(
      <ConsumableRow item={item()} editable={true} onUpdateQty={vi.fn()} onRemove={vi.fn()} />
    );
    expect(screen.getByText("Stimm")).toBeInTheDocument();
  });

  it("shows a status badge when linked to a campaign library item", () => {
    const libraryItem = { status: "archived" } as CampaignCustomItem<"consumable">;
    render(
      <ConsumableRow
        item={item()}
        libraryItem={libraryItem}
        editable={true}
        onUpdateQty={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByText(/archived/i)).toBeInTheDocument();
  });

  it("shows the description via the info modal only when one exists", () => {
    render(
      <ConsumableRow
        item={item({ description: "Restores 1d5 Wounds." })}
        editable={true}
        onUpdateQty={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /information/i })).toBeInTheDocument();
  });

  it("keeps the info button when there is no description and says nothing was recorded", async () => {
    const user = userEvent.setup();
    render(
      <ConsumableRow
        item={item({ description: "" })}
        editable={true}
        onUpdateQty={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    await user.click(screen.getByRole("button", { name: "Show information about Stimm" }));
    expect(screen.getByText("No description recorded.")).toBeInTheDocument();
  });

  it("wires the quantity control", async () => {
    const user = userEvent.setup();
    const onUpdateQty = vi.fn();
    render(
      <ConsumableRow
        item={item({ quantity: 2 })}
        editable={true}
        onUpdateQty={onUpdateQty}
        onRemove={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Decrease quantity" }));
    expect(onUpdateQty).toHaveBeenCalledWith("c1", 1);
  });

  it("calls onRemove only after removal is confirmed", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <ConsumableRow item={item()} editable={true} onUpdateQty={vi.fn()} onRemove={onRemove} />
    );

    await user.click(screen.getByRole("button", { name: "Remove Stimm" }));
    expect(onRemove).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalledWith("c1");
  });

  it("hides quantity and remove controls when not editable", () => {
    render(
      <ConsumableRow item={item()} editable={false} onUpdateQty={vi.fn()} onRemove={vi.fn()} />
    );
    expect(screen.queryByRole("button", { name: "Decrease quantity" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove Stimm" })).not.toBeInTheDocument();
  });
});
