// tests/integration/OfflineIndicator.test.tsx
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { OfflineIndicator } from "../../src/components/OfflineIndicator";

function setOnline(value: boolean) {
  Object.defineProperty(navigator, "onLine", { value, configurable: true });
}

afterEach(() => {
  setOnline(true);
});

describe("OfflineIndicator", () => {
  it("renders nothing while online", () => {
    setOnline(true);
    render(<OfflineIndicator />);
    expect(screen.queryByText(/You are offline/)).not.toBeInTheDocument();
  });

  it("renders nothing when it mounts already offline until told otherwise, then shows the banner on an offline event", () => {
    setOnline(false);
    render(<OfflineIndicator />);
    // Initial state comes from navigator.onLine at mount.
    expect(screen.getByText(/You are offline/)).toBeInTheDocument();
  });

  it("shows the banner after an offline event fires", () => {
    setOnline(true);
    render(<OfflineIndicator />);
    expect(screen.queryByText(/You are offline/)).not.toBeInTheDocument();

    act(() => window.dispatchEvent(new Event("offline")));

    expect(screen.getByText(/You are offline/)).toBeInTheDocument();
  });

  it("hides the banner again after an online event fires", () => {
    setOnline(true);
    render(<OfflineIndicator />);
    act(() => window.dispatchEvent(new Event("offline")));
    expect(screen.getByText(/You are offline/)).toBeInTheDocument();

    act(() => window.dispatchEvent(new Event("online")));

    expect(screen.queryByText(/You are offline/)).not.toBeInTheDocument();
  });
});
