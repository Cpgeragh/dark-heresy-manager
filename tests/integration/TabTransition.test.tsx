import { lazy, Suspense, useTransition } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useNavigate, useSearchParams } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";
import { PENDING_OVERLAY_DELAY_MS } from "../../src/constants/ui";
import { PendingOverlay } from "../../src/ui/PendingOverlay";

let releaseSlowTab: () => void = () => undefined;
let SlowTab = createSlowTab();

function createSlowTab() {
  const gate = new Promise<void>((resolve) => {
    releaseSlowTab = resolve;
  });
  return lazy(async () => {
    await gate;
    return { default: () => <div>Slow tab</div> };
  });
}

function TabHarness() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [pending, startTransition] = useTransition();
  const tab = params.get("tab") ?? "first";

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => startTransition(() => navigate("?tab=slow"))}>Open slow tab</button>
      <Suspense fallback={<div>Suspense fallback</div>}>
        {tab === "first" ? <div>First tab</div> : <SlowTab />}
      </Suspense>
      <PendingOverlay active={pending} />
    </div>
  );
}

function renderHarness() {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <TabHarness />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  SlowTab = createSlowTab();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("switching to a tab that is still downloading", () => {
  it("keeps the old tab on screen and shows no overlay for a fast wait", async () => {
    renderHarness();

    fireEvent.click(screen.getByRole("button", { name: "Open slow tab" }));
    await act(async () => {
      vi.advanceTimersByTime(PENDING_OVERLAY_DELAY_MS - 1);
    });

    expect(screen.getByText("First tab")).toBeInTheDocument();
    expect(screen.queryByText("Suspense fallback")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows the overlay over the old tab after the delay, then swaps in the new tab", async () => {
    renderHarness();

    fireEvent.click(screen.getByRole("button", { name: "Open slow tab" }));
    await act(async () => {
      vi.advanceTimersByTime(PENDING_OVERLAY_DELAY_MS);
    });

    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
    expect(screen.getByText("First tab")).toBeInTheDocument();
    expect(screen.queryByText("Suspense fallback")).not.toBeInTheDocument();

    await act(async () => {
      releaseSlowTab();
    });

    expect(screen.getByText("Slow tab")).toBeInTheDocument();
    expect(screen.queryByText("First tab")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
