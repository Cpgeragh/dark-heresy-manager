import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, expect, it } from "vitest";
import { SegmentedTimeline, type SegmentedTimelineSegment } from "../../src/ui/SegmentedTimeline";

const SEGMENTS: SegmentedTimelineSegment[] = [
  { width: 20, colourClass: "active-first", dimColourClass: "dim-first" },
  { width: 40, colourClass: "active-second", dimColourClass: "dim-second" },
  { width: 20, colourClass: "active-third", dimColourClass: "dim-third" },
];

describe("SegmentedTimeline", () => {
  it("renders active and dim layers using the supplied segment widths and colours", () => {
    const { container } = render(
      <SegmentedTimeline value={40} segments={SEGMENTS} totalWidth={80} />
    );

    expect(container.querySelectorAll(".dim-first, .dim-second, .dim-third")).toHaveLength(3);
    expect(container.querySelectorAll(".active-first, .active-second, .active-third")).toHaveLength(
      3
    );
    expect(container.querySelector(".dim-first")).toHaveStyle({ flexGrow: "20" });
    expect(container.querySelector(".active-second")).toHaveStyle({ flexGrow: "40" });
  });

  it("positions the active clipping edge and marker from the supplied value", () => {
    const { container, rerender } = render(
      <SegmentedTimeline value={40} segments={SEGMENTS} totalWidth={80} />
    );

    expect(container.querySelector('[style*="clip-path"]')).toHaveStyle({
      clipPath: "inset(0 50% 0 0)",
    });
    expect(container.querySelector(".bg-slate-100")).toHaveStyle({ left: "50%" });

    rerender(<SegmentedTimeline value={100} segments={SEGMENTS} totalWidth={80} />);

    expect(container.querySelector('[style*="clip-path"]')).toHaveStyle({
      clipPath: "inset(0 0% 0 0)",
    });
    expect(container.querySelector(".bg-slate-100")).toHaveStyle({ left: "100%" });
  });

  it("renders cumulative breakpoints between the start and maximum labels", () => {
    render(<SegmentedTimeline value={0} segments={SEGMENTS} totalWidth={80} />);

    expect(screen.getByText("0")).toHaveClass("left-0");
    expect(screen.getByText("20")).toHaveStyle({ left: "25%" });
    expect(screen.getByText("60")).toHaveStyle({ left: "75%" });
    expect(screen.getByText("80")).toHaveClass("left-full");
  });
});
