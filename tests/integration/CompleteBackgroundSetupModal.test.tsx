import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CharacterHeader, TalentsAndTraitsBlock } from "../../src/types/Character";
import { CompleteBackgroundSetupModal } from "../../src/pages/CharacterSheet/BackgroundTab/CompleteBackgroundSetupModal";

function modalProps(
  overrides: {
    header?: CharacterHeader;
    talents?: TalentsAndTraitsBlock;
    editable?: boolean;
  } = {}
) {
  return {
    header: overrides.header ?? { characterName: "Brother Corvus" },
    talents: overrides.talents ?? { homeworld: "", talents: [], traits: [] },
    editable: overrides.editable ?? true,
    onUpdateHeader: vi.fn(),
    onUpdateTalents: vi.fn(),
    onReturnToDashboard: vi.fn(),
    onComplete: vi.fn(),
  };
}

describe("CompleteBackgroundSetupModal", () => {
  it("requires Homeworld, Career, and the automatically assigned Rank before continuing", async () => {
    const user = userEvent.setup();
    const incomplete = modalProps();
    const view = render(<CompleteBackgroundSetupModal {...incomplete} />);

    expect(screen.getByRole("dialog", { name: "Complete Background" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Select Rank" })).not.toBeInTheDocument();

    const complete = modalProps({
      header: { characterName: "Brother Corvus", career: "Arbitrator", rank: "Trooper" },
      talents: { homeworld: "hive-world", talents: [], traits: [] },
    });
    view.rerender(<CompleteBackgroundSetupModal {...complete} />);

    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(complete.onComplete).toHaveBeenCalledOnce();
  });

  it("provides an explicit dashboard exit", async () => {
    const user = userEvent.setup();
    const props = modalProps();
    render(<CompleteBackgroundSetupModal {...props} />);

    await user.click(screen.getByRole("button", { name: "Return" }));
    expect(props.onReturnToDashboard).toHaveBeenCalledOnce();
  });

  it("cannot be dismissed with Escape", () => {
    const props = modalProps();
    render(<CompleteBackgroundSetupModal {...props} />);
    const dialog = screen.getByRole("dialog", { name: "Complete Background" });
    const cancelEvent = new Event("cancel", { bubbles: true, cancelable: true });

    fireEvent(dialog, cancelEvent);

    expect(cancelEvent.defaultPrevented).toBe(true);
    expect(dialog).toHaveAttribute("open");
  });

  it("explains when character editing is disabled", () => {
    render(<CompleteBackgroundSetupModal {...modalProps({ editable: false })} />);

    expect(
      screen.getByText("The DM must enable character editing before you can complete this setup.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });
});
