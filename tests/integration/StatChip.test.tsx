import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { StatChip } from "../../src/ui/chips/StatChip";

describe("StatChip", () => {
  it.each([
    { name: "small", props: { size: "sm" as const } },
    { name: "compact", props: {} },
    { name: "non-compact", props: { compactOnMobile: false } },
  ])("displays numeric zero in the $name layout", ({ props }) => {
    render(<StatChip label="Total" value={0} {...props} />);

    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("uses a proper em dash for a missing value", () => {
    render(<StatChip label="Total" value="" />);

    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
