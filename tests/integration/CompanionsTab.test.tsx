import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CompanionsTab } from "../../src/pages/characterSheet/CompanionsTab";

describe("CompanionsTab", () => {
  it("adds the Adeptus Arbites Cyber-Mastiff from the companion picker", () => {
    const onUpdate = vi.fn();
    render(<CompanionsTab companions={[]} editable onUpdate={onUpdate} />);

    fireEvent.click(screen.getByText("+ Add"));
    fireEvent.click(screen.getByRole("button", { name: "Select Adeptus Arbites Cyber-Mastiff" }));

    expect(onUpdate).toHaveBeenCalledWith([
      expect.objectContaining({
        referenceId: "ih-adeptus-arbites-cyber-mastiff",
        name: "Adeptus Arbites Cyber-Mastiff",
      }),
    ]);
  });

  it("renders the complete Cyber-Mastiff profile", () => {
    render(
      <CompanionsTab
        editable={false}
        onUpdate={vi.fn()}
        companions={[
          {
            id: "companion-1",
            referenceId: "ih-adeptus-arbites-cyber-mastiff",
            name: "Adeptus Arbites Cyber-Mastiff",
            source: "IH",
          },
        ]}
      />
    );

    expect(screen.getByText("4/8/12/24")).toBeInTheDocument();
    expect(screen.getByText(/Armour Plated/)).toBeInTheDocument();
    expect(screen.getByText(/Bite \(1d10\+3 R\)/)).toBeInTheDocument();
  });

  it("expands companion details instead of closing the picker in view mode", () => {
    render(<CompanionsTab companions={[]} editable={false} onUpdate={vi.fn()} />);

    fireEvent.click(screen.getByText("View"));
    fireEvent.click(screen.getByRole("button", { name: "Expand Adeptus Arbites Cyber-Mastiff details" }));

    expect(screen.getByRole("dialog", { name: "View Companions" })).toBeInTheDocument();
    expect(screen.getByText("4/8/12/24")).toBeInTheDocument();
  });
});
