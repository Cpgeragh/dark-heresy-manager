// tests/integration/PageShell.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PageShell } from "../../src/ui/PageShell";

describe("PageShell", () => {
  it("renders the title and children", () => {
    render(
      <PageShell title="Settings">
        <p>Body content</p>
      </PageShell>
    );
    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByText("Body content")).toBeInTheDocument();
  });

  it("accepts a non-string title", () => {
    render(
      <PageShell title={<span>Vex&apos;s Dashboard</span>}>
        <p>Body</p>
      </PageShell>
    );
    expect(screen.getByText("Vex's Dashboard")).toBeInTheDocument();
  });
});
