import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { ItemRow } from "../../src/pages/characterSheet/GearTab/ItemRow";
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
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  });

  it("shows a Remove button and no granted text for a normal item", () => {
    render(<ItemRow item={gearItem()} editable onRemove={vi.fn()} />);

    expect(screen.queryByText(/Granted$/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  });
});
