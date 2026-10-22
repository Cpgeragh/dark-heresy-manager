import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { ItemRow } from "../../src/pages/CharacterSheet/GearTab/ItemRow";
import type { GearItem } from "../../src/types/Character";

function gearItem(overrides: Partial<GearItem> = {}): GearItem {
  return { id: "g1", name: "Chattallium Ring", ...overrides };
}

describe("ItemRow", () => {
  it("shows an empty Rules line and an information icon that says nothing was recorded", async () => {
    const user = userEvent.setup();
    render(<ItemRow item={gearItem()} editable onRemove={vi.fn()} />);

    expect(screen.getByText("Rules")).toBeInTheDocument();
    expect(screen.getByText("-")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Show information about Chattallium Ring" })
    );
    expect(screen.getByText("No description recorded.")).toBeInTheDocument();
  });

  it("shows the description beside the name and the rules behind the Rules line", async () => {
    const user = userEvent.setup();
    render(
      <ItemRow
        item={gearItem({ description: "A plain ring.", rules: "Grants +10 to Charm Tests." })}
        editable
        onRemove={vi.fn()}
      />
    );

    await user.click(
      screen.getByRole("button", { name: "Show information about Chattallium Ring" })
    );
    expect(screen.getByText("A plain ring.")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await user.click(
      screen.getByRole("button", { name: "Show information about Chattallium Ring Rules" })
    );
    expect(screen.getByText("Grants +10 to Charm Tests.")).toBeInTheDocument();
  });

  it("puts the Remove button first in the action area", () => {
    render(<ItemRow item={gearItem()} editable onRemove={vi.fn()} />);

    const button = screen.getByRole("button", { name: "Remove Chattallium Ring" });
    expect(button.parentElement?.parentElement?.firstElementChild?.contains(button)).toBe(true);
  });

  it("shows the source, type, and Gained from line for a granted item, with no Remove button", () => {
    render(
      <ItemRow
        item={gearItem({
          grantedByTalentEntryUid: "career:imperial-psyker:sanctioned-psyker",
          grantedByTalentName: "Sanctioned Psyker",
          grantedByType: "Trait",
        })}
        editable
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByText("Gained from")).toBeInTheDocument();
    expect(screen.getByText("Sanctioned Psyker (Trait)")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remove Chattallium Ring" })
    ).not.toBeInTheDocument();
  });

  it("shows a named Remove button and confirms before removing a normal item", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<ItemRow item={gearItem()} editable onRemove={onRemove} />);

    expect(screen.queryByText("Gained from")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove Chattallium Ring" }));
    expect(onRemove).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it("names the Remove pop-up after a Gear Item", async () => {
    const user = userEvent.setup();
    render(<ItemRow item={gearItem()} editable onRemove={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Remove Chattallium Ring" }));

    expect(screen.getByRole("dialog", { name: "Remove Gear Item" })).toBeInTheDocument();
  });

  it("keeps the weight, availability, and source chips in one aligned row", () => {
    render(
      <ItemRow
        item={gearItem({ weight: "1 kg", availability: "Rare", source: "CR" })}
        editable
        onRemove={vi.fn()}
      />
    );

    const chipRow = screen.getByText("Rare").parentElement;
    expect(chipRow).toHaveClass("items-center");
    expect(screen.getByText("CR").parentElement).toBe(chipRow);
  });
});
