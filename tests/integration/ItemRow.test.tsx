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
  it("shows the source, type, and Granted status for a granted item, with no Remove button", () => {
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

    expect(screen.getByText("Sanctioned Psyker (Trait): Granted")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remove Chattallium Ring" })
    ).not.toBeInTheDocument();
  });

  it("shows a named Remove button and confirms before removing a normal item", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<ItemRow item={gearItem()} editable onRemove={onRemove} />);

    expect(screen.queryByText(/Granted$/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove Chattallium Ring" }));
    expect(onRemove).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalledOnce();
  });
});
