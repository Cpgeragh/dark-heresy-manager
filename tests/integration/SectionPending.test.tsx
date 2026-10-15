import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PENDING_OVERLAY_DELAY_MS } from "../../src/constants/ui";

const timedOutMock = vi.fn(() => false);
vi.mock("../../src/context/useRouteReady", () => ({
  useRouteLoadTimedOut: () => timedOutMock(),
}));
vi.mock("../../src/ui/RouteLoadError", () => ({
  RouteLoadError: () => <div>Mock RouteLoadError</div>,
}));

import { SectionPending } from "../../src/pages/CampaignOverview/SectionPending";

describe("SectionPending", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    timedOutMock.mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows nothing at first and the loading overlay once the delay has passed", () => {
    render(<SectionPending />);
    expect(screen.queryByRole("status", { name: "Loading" })).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(PENDING_OVERLAY_DELAY_MS);
    });

    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });

  it("shows the route error instead once the page has waited too long", () => {
    timedOutMock.mockReturnValue(true);
    render(<SectionPending />);

    expect(screen.getByText("Mock RouteLoadError")).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Loading" })).not.toBeInTheDocument();
  });
});
