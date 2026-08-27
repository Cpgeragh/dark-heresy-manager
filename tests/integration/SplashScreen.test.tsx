// tests/integration/SplashScreen.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SplashScreen } from "../../src/components/SplashScreen";

describe("SplashScreen", () => {
  it("always shows the app name", () => {
    render(<SplashScreen label="Loading…" />);
    expect(screen.getByText("Dark Heresy")).toBeInTheDocument();
    expect(screen.getByText("Manager")).toBeInTheDocument();
  });

  it("hides the label text for the default Loading… label", () => {
    render(<SplashScreen label="Loading…" />);
    expect(screen.queryByText("Loading…")).not.toBeInTheDocument();
  });

  it("shows a real status label when it isn't the default", () => {
    render(<SplashScreen label="Reconnecting…" />);
    expect(screen.getByText("Reconnecting…")).toBeInTheDocument();
  });
});
