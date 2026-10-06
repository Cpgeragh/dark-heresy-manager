import { useEffect, useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";
import { RouteHolder } from "../../src/components/RouteHolder";
import { PENDING_OVERLAY_DELAY_MS, ROUTE_LOAD_TIMEOUT_MS } from "../../src/constants/ui";
import {
  useRouteActive,
  useRouteLoadTimedOut,
  useRouteLoading,
} from "../../src/context/useRouteReady";

let releaseSlowPage: () => void = () => undefined;
let homeMounts = 0;

function HomePage() {
  useEffect(() => {
    homeMounts += 1;
  }, []);
  const active = useRouteActive();
  return (
    <div>
      <span>Home page</span>
      <span>{active ? "Home active" : "Home inactive"}</span>
      <Link to="/slow">Go to slow page</Link>
      <Link to="/?filter=1">Change filter</Link>
    </div>
  );
}

function SlowPage() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const gate = new Promise<void>((resolve) => {
      releaseSlowPage = resolve;
    });
    void gate.then(() => setLoading(false));
  }, []);
  useRouteLoading(loading);
  const active = useRouteActive();
  const timedOut = useRouteLoadTimedOut();
  if (loading) return <div>{timedOut ? "Slow page timed out" : "Slow page waiting"}</div>;
  return (
    <div>
      <span>Slow page ready</span>
      <span>{active ? "Slow active" : "Slow inactive"}</span>
    </div>
  );
}

function renderHolder(initialEntry = "/") {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <RouteHolder
        splashLabel="Loading…"
        routes={(location) => (
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route path="/slow" element={<SlowPage />} />
          </Routes>
        )}
      />
    </MemoryRouter>
  );
}

beforeEach(() => {
  homeMounts = 0;
  releaseSlowPage = () => undefined;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("RouteHolder", () => {
  it("shows a page that has nothing to wait for straight away, with no logo screen", async () => {
    renderHolder();

    expect(await screen.findByText("Home page")).toBeVisible();
    expect(screen.queryByText("Dark Heresy")).not.toBeInTheDocument();
    expect(screen.getByText("Home active")).toBeInTheDocument();
  });

  it("keeps the logo screen on the first load until the page has finished loading", async () => {
    renderHolder("/slow");

    await act(async () => {});
    expect(screen.getByText("Dark Heresy")).toBeInTheDocument();
    expect(screen.getByText("Slow page waiting")).not.toBeVisible();

    await act(async () => {
      releaseSlowPage();
    });

    expect(screen.getByText("Slow page ready")).toBeVisible();
    expect(screen.queryByText("Dark Heresy")).not.toBeInTheDocument();
  });

  it("keeps the old page visible while the new page loads, builds the new page out of sight and inactive", async () => {
    renderHolder();
    await screen.findByText("Home page");

    fireEvent.click(screen.getByText("Go to slow page"));
    await act(async () => {});

    expect(screen.getByText("Home page")).toBeVisible();
    expect(screen.getByText("Slow page waiting")).not.toBeVisible();
  });

  it("shows no overlay when the new page is ready within the delay", async () => {
    vi.useFakeTimers();
    renderHolder();
    await act(async () => {});

    fireEvent.click(screen.getByText("Go to slow page"));
    await act(async () => {
      vi.advanceTimersByTime(PENDING_OVERLAY_DELAY_MS - 1);
      releaseSlowPage();
    });

    expect(screen.getByText("Slow page ready")).toBeVisible();
    expect(screen.queryByText("Home page")).not.toBeInTheDocument();
    await act(async () => {
      vi.advanceTimersByTime(PENDING_OVERLAY_DELAY_MS * 5);
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows the overlay over the old page after the delay, then swaps when the new page is ready", async () => {
    vi.useFakeTimers();
    renderHolder();
    await act(async () => {});

    fireEvent.click(screen.getByText("Go to slow page"));
    await act(async () => {
      vi.advanceTimersByTime(PENDING_OVERLAY_DELAY_MS);
    });

    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
    expect(screen.getByText("Home page")).toBeVisible();

    await act(async () => {
      releaseSlowPage();
    });

    expect(screen.getByText("Slow page ready")).toBeVisible();
    expect(screen.getByText("Slow active")).toBeInTheDocument();
    expect(screen.queryByText("Home page")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("reveals the page with a timed out flag when loading takes longer than the timeout", async () => {
    vi.useFakeTimers();
    renderHolder();
    await act(async () => {});

    fireEvent.click(screen.getByText("Go to slow page"));
    await act(async () => {
      vi.advanceTimersByTime(ROUTE_LOAD_TIMEOUT_MS);
    });

    expect(screen.getByText("Slow page timed out")).toBeVisible();
    expect(screen.queryByText("Home page")).not.toBeInTheDocument();
  });

  it("does not rebuild the page when only its query string changes", async () => {
    renderHolder();
    await screen.findByText("Home page");
    expect(homeMounts).toBe(1);

    fireEvent.click(screen.getByText("Change filter"));
    await act(async () => {});

    expect(screen.getByText("Home page")).toBeVisible();
    expect(homeMounts).toBe(1);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
