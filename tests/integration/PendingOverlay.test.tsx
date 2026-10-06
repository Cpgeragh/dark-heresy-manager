import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";
import { PENDING_OVERLAY_DELAY_MS } from "../../src/constants/ui";
import { PendingOverlay } from "../../src/ui/PendingOverlay";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("PendingOverlay", () => {
  it("shows nothing when it is not active", () => {
    render(<PendingOverlay active={false} />);

    act(() => {
      vi.advanceTimersByTime(PENDING_OVERLAY_DELAY_MS * 5);
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("stays hidden for a fast wait", () => {
    const view = render(<PendingOverlay active />);

    act(() => {
      vi.advanceTimersByTime(PENDING_OVERLAY_DELAY_MS - 1);
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    view.rerender(<PendingOverlay active={false} />);
    act(() => {
      vi.advanceTimersByTime(PENDING_OVERLAY_DELAY_MS * 5);
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("appears with the dots once the delay has passed", () => {
    render(<PendingOverlay active />);

    act(() => {
      vi.advanceTimersByTime(PENDING_OVERLAY_DELAY_MS);
    });

    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });

  it("disappears as soon as the wait ends and starts its delay again for the next wait", () => {
    const view = render(<PendingOverlay active />);
    act(() => {
      vi.advanceTimersByTime(PENDING_OVERLAY_DELAY_MS);
    });
    expect(screen.getByRole("status")).toBeInTheDocument();

    view.rerender(<PendingOverlay active={false} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    view.rerender(<PendingOverlay active />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(PENDING_OVERLAY_DELAY_MS);
    });
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
