// tests/integration/ArmourTab.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { ArmourTab } from "../../src/pages/characterSheet/ArmourTab";
import type { WornArmourPiece, CyberneticItem } from "../../src/types/Character";

function piece(over: Partial<WornArmourPiece> = {}): WornArmourPiece {
  return { id: "a1", name: "Flak Jacket", locations: ["body"], ap: 3, worn: true, ...over };
}

function renderTab(props: Partial<React.ComponentProps<typeof ArmourTab>> = {}) {
  const onUpdate = vi.fn();
  render(
    <ArmourTab
      armour={[piece()]}
      toughnessBonus={4}
      editable={true}
      onUpdate={onUpdate}
      cybernetics={[] as CyberneticItem[]}
      {...props}
    />
  );
  return { onUpdate };
}

describe("ArmourTab", () => {
  it("renders the location summary and section headers with counts", () => {
    renderTab();
    expect(screen.getByText("Location Summary")).toBeInTheDocument();
    expect(screen.getByText(/Worn \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Stowed \(0\)/)).toBeInTheDocument();
    expect(screen.getByText(/Force Fields \(0\)/)).toBeInTheDocument();
  });

  it("renders a worn piece by name", () => {
    renderTab();
    expect(screen.getAllByText("Flak Jacket").length).toBeGreaterThan(0);
  });

  it("reflects the toughness bonus in the summary table", () => {
    renderTab({ toughnessBonus: 4 });
    // TB column shows the bonus for each of the six locations.
    expect(screen.getAllByText("4").length).toBeGreaterThanOrEqual(6);
  });

  it("shows equip/stow add affordances when editable", () => {
    renderTab();
    expect(screen.getByText("+ Equip")).toBeInTheDocument();
    expect(screen.getByText("+ Stow")).toBeInTheDocument();
  });

  it("shows 'View' instead of add affordances in read-only mode", () => {
    renderTab({ editable: false, armour: [] });
    expect(screen.getAllByText("View").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("+ Equip")).not.toBeInTheDocument();
  });

  it("shows empty states when there is no armour", () => {
    renderTab({ armour: [] });
    expect(screen.getByText("No armour worn.")).toBeInTheDocument();
    expect(screen.getByText("No armour stowed.")).toBeInTheDocument();
    expect(screen.getByText("No force field equipped.")).toBeInTheDocument();
  });
});
