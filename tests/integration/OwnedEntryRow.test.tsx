import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { OwnedEntryRow } from "../../src/ui/OwnedEntryRow";
import type { CampaignCustomItem } from "../../src/types/CustomItems";

const draftItem = { status: "draft" } as CampaignCustomItem;

describe("OwnedEntryRow information", () => {
  it("always shows the information icon and says nothing was recorded when it is empty", async () => {
    const user = userEvent.setup();
    render(<OwnedEntryRow name="Grapnel" editable />);

    await user.click(screen.getByRole("button", { name: "Show information about Grapnel" }));

    expect(screen.getByText("No description recorded.")).toBeInTheDocument();
  });

  it("shows the supplied information in the window", async () => {
    const user = userEvent.setup();
    render(<OwnedEntryRow name="Grapnel" editable information={<p>A hooked line.</p>} />);

    await user.click(screen.getByRole("button", { name: "Show information about Grapnel" }));

    expect(screen.getByText("A hooked line.")).toBeInTheDocument();
  });
});

describe("OwnedEntryRow lines", () => {
  it("prints the supplied lines in the fixed order", () => {
    render(
      <OwnedEntryRow
        name="Bionic Arm"
        editable
        lines={{
          notes: { value: "Left side" },
          talentEffects: "Talented (Awareness) (Talent): +10",
          gainedFrom: "Skin of Iron (Talent)",
          rules: { value: "Rule text" },
          mishaps: { value: "Explosive" },
          qualities: { value: "Reliable" },
          duration: { value: "1d10 minutes" },
          craftsmanship: { value: "Good" },
        }}
      />
    );

    const labels = screen
      .getAllByText(
        /^(Craftsmanship|Duration|Qualities|Rules|Mishaps|Gained from|Talent effects|Notes)$/
      )
      .map((label) => label.textContent);

    expect(labels).toEqual([
      "Craftsmanship",
      "Duration",
      "Qualities",
      "Rules",
      "Mishaps",
      "Gained from",
      "Talent effects",
      "Notes",
    ]);
  });

  it("shows a dash for a supplied line with nothing in it", () => {
    render(<OwnedEntryRow name="Bionic Arm" editable lines={{ rules: {} }} />);

    expect(screen.getByText("Rules")).toBeInTheDocument();
    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("shows no line the caller did not supply", () => {
    render(<OwnedEntryRow name="Bionic Arm" editable />);

    expect(screen.queryByText("Rules")).not.toBeInTheDocument();
    expect(screen.queryByText("Craftsmanship")).not.toBeInTheDocument();
  });
});

describe("OwnedEntryRow chips", () => {
  it("draws all chips in one aligned row", () => {
    render(
      <OwnedEntryRow
        name="Bionic Arm"
        editable
        chips={
          <>
            <span>First chip</span>
            <span>Second chip</span>
          </>
        }
      />
    );

    const first = screen.getByText("First chip");
    expect(first.parentElement).toBe(screen.getByText("Second chip").parentElement);
    expect(first.parentElement).toHaveClass("items-center");
  });
});

describe("OwnedEntryRow removal", () => {
  it("opens the Remove pop-up named after the kind", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <OwnedEntryRow
        name="Grapnel"
        editable
        removal={{ kind: "Gear Item", onRemove }}
        actions={<button type="button">Use</button>}
      />
    );

    const labels = screen.getAllByRole("button").map((button) => button.getAttribute("aria-label"));
    expect(labels[1]).toBe("Remove Grapnel");

    await user.click(screen.getByRole("button", { name: "Remove Grapnel" }));
    expect(screen.getByRole("dialog", { name: "Remove Gear Item" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it("shows no trash button when the removal is hidden", () => {
    render(
      <OwnedEntryRow
        name="Grapnel"
        editable
        removal={{ kind: "Gear Item", onRemove: vi.fn(), hidden: true }}
      />
    );

    expect(screen.queryByRole("button", { name: "Remove Grapnel" })).not.toBeInTheDocument();
  });

  it("shows no trash button when the sheet is not editable", () => {
    render(
      <OwnedEntryRow
        name="Grapnel"
        editable={false}
        removal={{ kind: "Gear Item", onRemove: vi.fn() }}
      />
    );

    expect(screen.queryByRole("button", { name: "Remove Grapnel" })).not.toBeInTheDocument();
  });
});

describe("OwnedEntryRow collapsible", () => {
  function renderCollapsible(extra: Partial<React.ComponentProps<typeof OwnedEntryRow>> = {}) {
    return render(
      <OwnedEntryRow
        name="Flak Jacket"
        editable
        collapsible
        chips={<span>Location chip</span>}
        lines={{ rules: { value: "Rule text" }, notes: { value: "Note text" } }}
        body={<p>Upgrades section</p>}
        {...extra}
      />
    );
  }

  it("starts closed and keeps the name and information icon in the header", () => {
    renderCollapsible();

    expect(screen.getByRole("button", { name: "Expand Flak Jacket details" })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
    expect(
      screen.getByRole("button", { name: "Show information about Flak Jacket" })
    ).toBeInTheDocument();
    expect(screen.queryByText("Location chip")).not.toBeInTheDocument();
    expect(screen.queryByText("Rules")).not.toBeInTheDocument();
    expect(screen.queryByText("Upgrades section")).not.toBeInTheDocument();
  });

  it("opens to show the chips, the lines in the fixed order and the body", async () => {
    const user = userEvent.setup();
    renderCollapsible();

    await user.click(screen.getByRole("button", { name: "Expand Flak Jacket details" }));

    expect(screen.getByText("Location chip")).toBeInTheDocument();
    expect(screen.getByText("Upgrades section")).toBeInTheDocument();
    const labels = screen.getAllByText(/^(Rules|Notes)$/).map((label) => label.textContent);
    expect(labels).toEqual(["Rules", "Notes"]);
  });

  it("closes again on a second press", async () => {
    const user = userEvent.setup();
    renderCollapsible();

    await user.click(screen.getByRole("button", { name: "Expand Flak Jacket details" }));
    await user.click(screen.getByRole("button", { name: "Collapse Flak Jacket details" }));

    expect(screen.queryByText("Location chip")).not.toBeInTheDocument();
  });

  it("stays open with no chevron when forced expanded", () => {
    renderCollapsible({ forceExpanded: true });

    expect(screen.getByText("Location chip")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Expand / })).not.toBeInTheDocument();
  });

  it("dims the card while inactive and uses the amber look for Archeotech", () => {
    const { container } = renderCollapsible({ inactive: true, tone: "archeotech" });

    expect(container.firstElementChild).toHaveClass("opacity-60", "border-amber-500/60");
  });

  it("keeps the header action tappable without opening the card", async () => {
    const user = userEvent.setup();
    const onUse = vi.fn();
    renderCollapsible({
      actions: (
        <button type="button" onClick={onUse}>
          Wear
        </button>
      ),
    });

    const button = screen.getByRole("button", { name: "Wear" });
    expect(button.parentElement).toHaveClass("pointer-events-auto");
    await user.click(button);

    expect(onUse).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Expand Flak Jacket details" })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  it("keeps the Remove button in the closed header", () => {
    renderCollapsible({ removal: { kind: "Armour Piece", onRemove: vi.fn() } });

    expect(screen.getByRole("button", { name: "Remove Flak Jacket" })).toBeInTheDocument();
  });
});

describe("OwnedEntryRow custom items and body", () => {
  it("shows the status badge and the custom item buttons for a library item", () => {
    render(
      <OwnedEntryRow
        name="Grapnel"
        editable
        library={{ libraryItem: draftItem, canEditDefinition: true, onEditDefinition: vi.fn() }}
      />
    );

    expect(screen.getByText("draft")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit Definition" })).toBeInTheDocument();
  });

  it("shows no badge or custom item buttons without a library item", () => {
    render(<OwnedEntryRow name="Grapnel" editable />);

    expect(screen.queryByText("draft")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit Definition" })).not.toBeInTheDocument();
  });

  it("renders the body content below the lines", () => {
    render(<OwnedEntryRow name="Armour" editable body={<p>Upgrades section</p>} />);

    expect(screen.getByText("Upgrades section")).toBeInTheDocument();
  });
});
