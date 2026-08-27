// tests/integration/Panel.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Panel } from "../../src/ui/Panel";

describe("Panel", () => {
  it("renders children with the default spacing", () => {
    render(
      <Panel>
        <p>Body content</p>
      </Panel>
    );
    const content = screen.getByText("Body content");
    expect(content.parentElement).toHaveClass("space-y-6");
  });

  it("uses compact spacing when requested", () => {
    render(
      <Panel spacing="compact">
        <p>Body content</p>
      </Panel>
    );
    expect(screen.getByText("Body content").parentElement).toHaveClass("space-y-4");
  });

  it("merges an extra className onto the default styling", () => {
    render(
      <Panel className="mt-8">
        <p>Body content</p>
      </Panel>
    );
    const wrapper = screen.getByText("Body content").parentElement;
    expect(wrapper).toHaveClass("mt-8");
    expect(wrapper).toHaveClass("border-slate-700");
  });
});
