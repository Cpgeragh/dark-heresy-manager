import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { CompanionsTab } from "../../src/pages/CharacterSheet/CompanionsTab";

describe("CompanionsTab", () => {
  it("adds the Adeptus Arbites Cyber-Mastiff from the companion picker", () => {
    const onUpdate = vi.fn();
    render(<CompanionsTab companions={[]} editable onUpdate={onUpdate} />);

    fireEvent.click(screen.getByRole("button", { name: "Add Companion" }));
    fireEvent.click(screen.getByRole("button", { name: "Select Adeptus Arbites Cyber-Mastiff" }));

    expect(onUpdate).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          referenceId: "ih-adeptus-arbites-cyber-mastiff",
          name: "Adeptus Arbites Cyber-Mastiff",
        }),
      ],
      { optimistic: true }
    );
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

    expect(screen.queryByText("4/8/12/24")).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Expand Adeptus Arbites Cyber-Mastiff details" })
    );

    expect(screen.getByText("4/8/12/24")).toBeInTheDocument();
    expect(screen.getByText(/Armour Plated/)).toBeInTheDocument();
    expect(screen.getByText(/Bite \(1d10\+3 R\)/)).toBeInTheDocument();
  });

  it("expands companion details instead of closing the picker in view mode", () => {
    render(<CompanionsTab companions={[]} editable={false} onUpdate={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "View Companions" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Expand Adeptus Arbites Cyber-Mastiff details" })
    );

    expect(screen.getByRole("dialog", { name: "View Companions" })).toBeInTheDocument();
    expect(screen.getByText("4/8/12/24")).toBeInTheDocument();
  });

  it("does not show a spinner on the picker card for an optimistic add", async () => {
    const user = userEvent.setup();
    let finish: () => void = () => undefined;
    const onUpdate = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    render(<CompanionsTab companions={[]} editable onUpdate={onUpdate} />);

    await user.click(screen.getByRole("button", { name: "Add Companion" }));
    const selectButton = screen.getByRole("button", {
      name: "Select Adeptus Arbites Cyber-Mastiff",
    });
    await user.click(selectButton);

    expect(onUpdate).toHaveBeenCalledWith(
      [expect.objectContaining({ referenceId: "ih-adeptus-arbites-cyber-mastiff" })],
      { optimistic: true }
    );
    expect(selectButton).not.toHaveAttribute("aria-busy");
    expect(selectButton).not.toBeDisabled();

    await act(async () => finish());
  });

  it("starts collapsed and keeps the Remove button in the closed header", () => {
    render(
      <CompanionsTab
        editable
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

    expect(
      screen.getByRole("button", { name: "Expand Adeptus Arbites Cyber-Mastiff details" })
    ).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.getByRole("button", { name: "Remove Adeptus Arbites Cyber-Mastiff" })
    ).toBeInTheDocument();
  });

  it("keeps the Remove pop-up waiting until the companion removal is saved", async () => {
    const user = userEvent.setup();
    let finish: () => void = () => undefined;
    const onUpdate = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    render(
      <CompanionsTab
        editable
        onUpdate={onUpdate}
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

    const removeButton = screen.getByRole("button", {
      name: "Remove Adeptus Arbites Cyber-Mastiff",
    });
    await user.click(removeButton);
    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(onUpdate).toHaveBeenCalledWith([]);
    expect(screen.getByRole("dialog", { name: "Remove Companion" })).toBeInTheDocument();

    await act(async () => finish());
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Remove Companion" })).not.toBeInTheDocument()
    );
  });

  it("keeps the Remove pop-up open when removing a companion is refused", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn().mockResolvedValue(false);
    render(
      <CompanionsTab
        editable
        onUpdate={onUpdate}
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

    await user.click(screen.getByRole("button", { name: "Remove Adeptus Arbites Cyber-Mastiff" }));
    await user.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith([]));
    expect(screen.getByRole("dialog", { name: "Remove Companion" })).toBeInTheDocument();
  });
});
