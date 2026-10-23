import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, expect, it } from "vitest";
import { ItemMetaChips } from "../../src/ui/chips/ItemMetaChips";

describe("ItemMetaChips weight", () => {
  it("shows a weight with a footnote dagger as its number", () => {
    render(<ItemMetaChips weight="6 kg†" />);
    expect(screen.getByText("6 kg")).toBeInTheDocument();
  });

  it("shows a weight with extra words as written", () => {
    render(<ItemMetaChips weight="4 kg case" />);
    expect(screen.getByText("4 kg case")).toBeInTheDocument();
  });

  it("shows the word Varies for a Varies weight beside the other chips", () => {
    render(<ItemMetaChips weight="Varies" value="10 Thrones" />);
    expect(screen.getByText("Varies")).toBeInTheDocument();
    expect(screen.getByText(/10 Thrones/)).toBeInTheDocument();
  });

  it("shows 0 kg for a dash", () => {
    render(<ItemMetaChips weight="—" />);
    expect(screen.getByText("0 kg")).toBeInTheDocument();
  });
});
