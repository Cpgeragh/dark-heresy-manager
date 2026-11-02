import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, expect, it } from "vitest";
import { ItemMetaChips } from "../../src/ui/chips/ItemMetaChips";

describe("ItemMetaChips assigned later", () => {
  it("shows the word Varies for a cost and an availability still to be assigned", () => {
    render(<ItemMetaChips assignedLater value="—" availability="Varies" />);
    expect(screen.getAllByText("Varies")).toHaveLength(2);
    expect(screen.queryByText(/₮/)).not.toBeInTheDocument();
  });

  it("shows a real cost and availability as written", () => {
    render(<ItemMetaChips assignedLater value="500 Thrones" availability="Rare" />);
    expect(screen.getByText("₮ 500")).toBeInTheDocument();
    expect(screen.getByText("Rare")).toBeInTheDocument();
    expect(screen.queryByText("Varies")).not.toBeInTheDocument();
  });

  it("shows a dash cost, not Varies, when nothing is assigned later", () => {
    render(<ItemMetaChips value="—" />);
    expect(screen.getByText("₮ —")).toBeInTheDocument();
    expect(screen.queryByText("Varies")).not.toBeInTheDocument();
  });

  it("keeps the plus sign on an open-ended cost and drops the word Thrones", () => {
    render(<ItemMetaChips value="20+ Thrones" />);
    expect(screen.getByText("₮ 20+")).toBeInTheDocument();
    expect(screen.queryByText(/Thrones/)).not.toBeInTheDocument();
  });
});
