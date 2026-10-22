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
  it("shows the duration as a labelled line on the card", () => {
    render(
      <DrugRow
        item={item({ name: "Frenzon", referenceId: "cr-frenzon" })}
        editable={true}
        onUpdateQty={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByText("Duration")).toBeInTheDocument();
    expect(screen.getByText("1d10 minutes")).toBeInTheDocument();
  });

  it("shows the notes as the description and keeps the duration out of the window", async () => {
    const user = userEvent.setup();
    render(
      <DrugRow
        item={item({ name: "Frenzon", referenceId: "cr-frenzon" })}
        editable={true}
        onUpdateQty={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Show information about Frenzon" }));
    const dialog = screen.getByRole("dialog", { name: "Frenzon" });
    expect(dialog).toHaveTextContent("A generic name for a variety of combat drugs");
    expect(dialog).not.toHaveTextContent("Duration");
    expect(dialog).not.toHaveTextContent("Gains the Frenzy talent");
  });

  it("shows the effect and side effects behind the Rules line", async () => {
    const user = userEvent.setup();
    render(
      <DrugRow
        item={item({ name: "De-Tox", referenceId: "cr-de-tox" })}
        editable={true}
        onUpdateQty={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Show information about De-Tox Rules" }));
    const dialog = screen.getByRole("dialog", { name: "De-Tox Rules" });
    expect(dialog).toHaveTextContent("Effect");
    expect(dialog).toHaveTextContent("Side Effects");
    expect(dialog).toHaveTextContent("Immediately ends the ongoing effects");
  });

  it("says no description was recorded for a drug without notes", async () => {
    const user = userEvent.setup();
    render(
      <DrugRow
        item={item({ name: "De-Tox", referenceId: "cr-de-tox" })}
        editable={true}
        onUpdateQty={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Show information about De-Tox" }));
    expect(screen.getByText("No description recorded.")).toBeInTheDocument();
  });

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

    await user.click(screen.getByRole("button", { name: "Show information about Obscura Rules" }));
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

  it("calls onRemove only after removal is confirmed", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<DrugRow item={item()} editable={true} onUpdateQty={vi.fn()} onRemove={onRemove} />);

    await user.click(screen.getByRole("button", { name: "Remove Obscura" }));
    expect(onRemove).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalledWith("d1");
  });

  it("shows no weight chip for a custom drug with no weight recorded", () => {
    render(<DrugRow item={item()} editable={true} onUpdateQty={vi.fn()} onRemove={vi.fn()} />);

    expect(screen.queryByText(/kg/)).not.toBeInTheDocument();
  });

  it("names the Remove pop-up after a Drug", async () => {
    const user = userEvent.setup();
    render(<DrugRow item={item()} editable={true} onUpdateQty={vi.fn()} onRemove={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Remove Obscura" }));

    expect(screen.getByRole("dialog", { name: "Remove Drug" })).toBeInTheDocument();
  });

  it("hides the quantity and remove controls when not editable", () => {
    render(<DrugRow item={item()} editable={false} onUpdateQty={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Increase quantity" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove Obscura" })).not.toBeInTheDocument();
  });
});
