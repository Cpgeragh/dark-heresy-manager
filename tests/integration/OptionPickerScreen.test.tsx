// tests/integration/OptionPickerScreen.test.tsx
import { describe, it, expect, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { OptionPickerScreen } from "../../src/ui/pickers/OptionPickerScreen";

const OPTIONS = ["Common", "Rare", "Very Rare"] as const;

function setup(selected?: string) {
  const onSelect = vi.fn();
  const onClose = vi.fn();
  render(
    <OptionPickerScreen
      title="Availability"
      options={OPTIONS}
      selected={selected}
      onSelect={onSelect}
      onClose={onClose}
    />
  );
  return { onSelect, onClose };
}

describe("OptionPickerScreen", () => {
  it("renders the title and every option", () => {
    setup();
    expect(screen.getByText("Availability")).toBeInTheDocument();
    for (const option of OPTIONS) {
      expect(screen.getByText(option)).toBeInTheDocument();
    }
  });

  it("calls onSelect with the clicked option", async () => {
    const user = userEvent.setup();
    const { onSelect } = setup();
    await user.click(screen.getByText("Rare"));
    expect(onSelect).toHaveBeenCalledWith("Rare");
  });

  it("calls onClose when the back button is clicked", async () => {
    const user = userEvent.setup();
    const { onClose } = setup();
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("highlights the currently selected option", () => {
    setup("Rare");
    const rareButton = screen.getByText("Rare").closest("button")!;
    expect(rareButton.className).toContain("bg-slate-800");
  });
});

describe("OptionPickerScreen layout options", () => {
  it("shows the Close cross and no Back arrow when standalone", () => {
    render(
      <OptionPickerScreen
        standalone
        title="Rank Type"
        options={OPTIONS}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
  });

  it("shows an intro sentence above the options", () => {
    render(
      <OptionPickerScreen
        title="Insanity Gained"
        intro="Roll 1d5 and select the result."
        options={OPTIONS}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText("Roll 1d5 and select the result.")).toBeInTheDocument();
  });

  it("keeps the chosen row busy until an async onSelect settles", async () => {
    const user = userEvent.setup();
    let finish: () => void = () => undefined;
    const onSelect = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    render(
      <OptionPickerScreen
        title="Availability"
        options={OPTIONS}
        onSelect={onSelect}
        onClose={vi.fn()}
      />
    );

    await user.click(screen.getByText("Rare"));
    expect(screen.getByText("Rare").closest("button")).toHaveAttribute("aria-busy", "true");

    await act(async () => finish());
    expect(screen.getByText("Rare").closest("button")).not.toHaveAttribute("aria-busy");
  });

  it("applies a width override to the dialog", () => {
    render(
      <OptionPickerScreen
        title="Availability"
        maxWidth="max-w-md"
        options={OPTIONS}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByRole("dialog", { name: "Availability" })).toHaveClass("max-w-md");
  });
});

describe("OptionPickerScreen with value/label pairs", () => {
  const VALUE_LABEL_OPTIONS = [
    { value: "I", label: "Impact" },
    { value: "R", label: "Rending" },
  ];

  it("shows the label but selects with the value", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <OptionPickerScreen
        title="Damage Type"
        options={VALUE_LABEL_OPTIONS}
        onSelect={onSelect}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText("Impact")).toBeInTheDocument();
    expect(screen.queryByText("I")).not.toBeInTheDocument();
    await user.click(screen.getByText("Impact"));
    expect(onSelect).toHaveBeenCalledWith("I");
  });

  it("highlights by matching the selected value, not the label", () => {
    render(
      <OptionPickerScreen
        title="Damage Type"
        options={VALUE_LABEL_OPTIONS}
        selected="R"
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />
    );
    const rendingButton = screen.getByText("Rending").closest("button")!;
    expect(rendingButton.className).toContain("bg-slate-800");
  });

  it("shows a numbered Owned chip when an option supplies an owned count", () => {
    render(
      <OptionPickerScreen
        title="Characteristic"
        options={[{ value: "Weapon Skill", label: "Weapon Skill", ownedCount: 2 }]}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText("Owned: 2")).toBeInTheDocument();
  });
});
