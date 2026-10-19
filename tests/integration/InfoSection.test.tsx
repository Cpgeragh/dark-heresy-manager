import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { InfoSection } from "../../src/ui/InfoSection";
import { uiRuleName } from "../../src/ui/styles/editableStyles";

describe("InfoSection", () => {
  it("shows its heading in the rule name style above its content", () => {
    render(
      <InfoSection heading="Notes">
        <p>Player note</p>
      </InfoSection>
    );

    expect(screen.getByText("Notes")).toHaveClass(uiRuleName);
    expect(screen.getByText("Player note")).toBeInTheDocument();
  });

  it("uses uppercase, bold, blue heading text", () => {
    expect(uiRuleName).toContain("uppercase");
    expect(uiRuleName).toContain("font-semibold");
    expect(uiRuleName).toContain("text-sky-300/85");
  });
});
