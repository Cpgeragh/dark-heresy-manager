// tests/integration/SplashScreen.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SplashScreen } from "../../src/components/SplashScreen";
import { colourAmberPlain } from "../../src/ui/styles/colourTokens";

describe("SplashScreen", () => {
  it("always shows the app name", () => {
    render(<SplashScreen label="Loading…" />);
    expect(screen.getByText("Dark Heresy")).toBeInTheDocument();
    expect(screen.getByText("Manager")).toBeInTheDocument();
  });

  it("uses the standard red accent for the app title", () => {
    render(<SplashScreen label="Loading…" />);

    expect(screen.getByText("Dark Heresy")).toHaveClass("text-red-500");
    expect(screen.getByText("Dark Heresy")).not.toHaveClass("text-red-600");
  });

  it("uses the standard red accent for the shared spinner", () => {
    const { container } = render(<SplashScreen label="Loading…" />);
    const spinner = container.querySelector(".animate-spin");

    expect(spinner).toHaveClass("border-t-red-500");
    expect(spinner).not.toHaveClass("border-t-red-600");
  });

  it("hides the label text for the default Loading… label", () => {
    render(<SplashScreen label="Loading…" />);
    expect(screen.queryByText("Loading…")).not.toBeInTheDocument();
  });

  it("shows a real status label when it isn't the default", () => {
    render(<SplashScreen label="Reconnecting…" />);
    expect(screen.getByText("Reconnecting…")).toBeInTheDocument();
  });

  it("shows updates in the app's plain amber with animated dots", () => {
    const { container } = render(<SplashScreen label="Updating…" />);
    const label = container.querySelector(`.${colourAmberPlain}`);

    expect(label).toHaveTextContent("Updating...");
    expect(label?.querySelector('[aria-hidden="true"]')?.children).toHaveLength(3);
  });
});
