import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { NestedStatChip, StatChip } from "../../src/ui/chips/StatChip";

describe("StatChip", () => {
  it("displays numeric zero in the normal layout", () => {
    render(<StatChip label="Total" value={0} />);

    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("displays numeric zero in the nested layout", () => {
    render(<NestedStatChip label="Total" value={0} />);

    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("uses a proper em dash for a missing value", () => {
    render(<StatChip label="Total" value="" />);

    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
