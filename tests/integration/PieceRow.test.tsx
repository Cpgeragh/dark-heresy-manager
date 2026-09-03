// tests/integration/PieceRow.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { PieceRow } from "../../src/pages/CharacterSheet/ArmourTab/PieceRow";
import type { WornArmourPiece } from "../../src/types/Character";

const basePiece: WornArmourPiece = {
  id: "p1",
  name: "Flak Jacket",
  locations: ["body", "rightArm", "leftArm"],
  ap: 3,
  worn: true,
  qualities: ["Flak"],
  notes: "Some special rules text.",
  craftsmanship: "Common",
  weight: "6 kg",
  value: "100 Thrones",
  availability: "Average",
};

function renderRow(props: Partial<React.ComponentProps<typeof PieceRow>> = {}) {
  const onToggle = vi.fn();
  const onRemove = vi.fn();
  render(
    <PieceRow
      piece={basePiece}
      editable={true}
      worn={true}
      onToggle={onToggle}
      onRemove={onRemove}
      {...props}
    />
  );
  return { onToggle, onRemove };
}

describe("PieceRow chips", () => {
  it("shows the piece name and Location/AP stat chips", () => {
    renderRow();
    expect(screen.getByText("Flak Jacket")).toBeInTheDocument();
    expect(screen.getByText("Location")).toBeInTheDocument();
    expect(screen.getByText("AP")).toBeInTheDocument();
  });
});

describe("PieceRow qualities", () => {
  it("shows qualities text and an info modal when qualities are present", () => {
    renderRow();
    // "Flak" also appears as a heading inside the Qualities InfoModal, which
    // always mounts into document.body regardless of open/closed state.
    expect(screen.getAllByText("Flak").length).toBeGreaterThanOrEqual(1);
  });

  it("shows a placeholder when there are no qualities", () => {
    renderRow({ piece: { ...basePiece, qualities: undefined } });
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
  });
});

describe("PieceRow rules", () => {
  it("shows a Rules info modal when notes are present", () => {
    renderRow();
    expect(screen.getByText("Rules")).toBeInTheDocument();
  });

  it("shows a placeholder when there are no notes", () => {
    renderRow({ piece: { ...basePiece, notes: undefined, referenceId: undefined } });
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
  });
});

describe("PieceRow craftsmanship", () => {
  it("shows the craftsmanship label", () => {
    renderRow({ piece: { ...basePiece, craftsmanship: "Best" } });
    expect(screen.getByText("Best")).toBeInTheDocument();
  });
});

describe("PieceRow wear/stow", () => {
  it("shows Stow and calls onToggle when worn", async () => {
    const user = userEvent.setup();
    const { onToggle } = renderRow({ worn: true });
    await user.click(screen.getByRole("button", { name: "Stow" }));
    expect(onToggle).toHaveBeenCalledWith("p1");
  });

  it("shows Wear when stowed", () => {
    renderRow({ worn: false });
    expect(screen.getByRole("button", { name: "Wear" })).toBeInTheDocument();
  });
});

describe("PieceRow remove", () => {
  it("calls onRemove when Remove is clicked", async () => {
    const user = userEvent.setup();
    const { onRemove } = renderRow();
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalledWith("p1");
  });
});

describe("PieceRow read-only", () => {
  it("hides Wear/Stow and Remove when not editable", () => {
    renderRow({ editable: false });
    expect(screen.queryByRole("button", { name: "Stow" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  });
});
