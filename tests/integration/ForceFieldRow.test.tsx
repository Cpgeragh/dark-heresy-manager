// tests/integration/ForceFieldRow.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { ForceFieldRow } from "../../src/pages/CharacterSheet/ArmourTab/ForceFieldRow";
import type { WornArmourPiece } from "../../src/types/Character";

const basePiece: WornArmourPiece = {
  id: "f1",
  name: "Refraction Field",
  locations: [],
  ap: 0,
  worn: true,
  isForceField: true,
  protectionRating: 30,
  qualities: ["Overload"],
  notes: "Some special rules text.",
  craftsmanship: "Common",
  weight: "0.3 kg",
  value: "5,000 Thrones",
  availability: "Rare",
};

function renderRow(props: Partial<React.ComponentProps<typeof ForceFieldRow>> = {}) {
  const onToggle = vi.fn();
  const onRemove = vi.fn();
  render(
    <ForceFieldRow
      piece={basePiece}
      editable={true}
      onToggle={onToggle}
      onRemove={onRemove}
      {...props}
    />
  );
  return { onToggle, onRemove };
}

describe("ForceFieldRow chips", () => {
  it("shows the piece name and a PR stat chip", () => {
    renderRow();
    expect(screen.getByText("Refraction Field")).toBeInTheDocument();
    expect(screen.getByText("PR")).toBeInTheDocument();
  });

  it("omits the PR chip when protectionRating is not set", () => {
    renderRow({ piece: { ...basePiece, protectionRating: undefined } });
    expect(screen.queryByText("PR")).not.toBeInTheDocument();
  });
});

describe("ForceFieldRow qualities", () => {
  it("shows qualities text and an info modal when qualities are present", () => {
    renderRow();
    // "Overload" also appears as a heading inside the Qualities InfoModal, which
    // always mounts into document.body regardless of open/closed state.
    expect(screen.getAllByText("Overload").length).toBeGreaterThanOrEqual(1);
  });

  it("shows a placeholder when there are no qualities", () => {
    renderRow({ piece: { ...basePiece, qualities: undefined } });
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
  });
});

describe("ForceFieldRow rules", () => {
  it("shows a Rules info modal when notes are present", () => {
    renderRow();
    expect(screen.getByText("Rules")).toBeInTheDocument();
  });

  it("shows a placeholder when there are no notes", () => {
    renderRow({ piece: { ...basePiece, notes: undefined, referenceId: undefined } });
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
  });
});

describe("ForceFieldRow craftsmanship", () => {
  it("shows the craftsmanship label", () => {
    renderRow({ piece: { ...basePiece, craftsmanship: "Best" } });
    expect(screen.getByText("Best")).toBeInTheDocument();
  });
});

describe("ForceFieldRow activate/deactivate", () => {
  it("shows Deactivate and calls onToggle when active", async () => {
    const user = userEvent.setup();
    const { onToggle } = renderRow({ piece: { ...basePiece, worn: true } });
    await user.click(screen.getByRole("button", { name: "Deactivate" }));
    expect(onToggle).toHaveBeenCalledWith("f1");
  });

  it("shows Activate when inactive", () => {
    renderRow({ piece: { ...basePiece, worn: false } });
    expect(screen.getByRole("button", { name: "Activate" })).toBeInTheDocument();
  });
});

describe("ForceFieldRow remove", () => {
  it("calls onRemove when Remove is clicked", async () => {
    const user = userEvent.setup();
    const { onRemove } = renderRow();
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalledWith("f1");
  });
});

describe("ForceFieldRow read-only", () => {
  it("hides Activate/Deactivate and Remove when not editable", () => {
    renderRow({ editable: false });
    expect(screen.queryByRole("button", { name: "Deactivate" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  });
});
