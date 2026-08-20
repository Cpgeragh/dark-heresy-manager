import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { TalentsTab } from "../../src/pages/characterSheet/TalentsTab";
import { TraitsTab } from "../../src/pages/characterSheet/TraitsTab";
import { ToastProvider } from "../../src/components/Toast";
import type { PsychicBlock, TalentsAndTraitsBlock } from "../../src/types/Character";

const emptyPsychic: PsychicBlock = { psyRating: 0, minorPowers: [], majorPowers: [] };

function makeTalents(): TalentsAndTraitsBlock {
  return { homeworld: "", talents: [], traits: [] };
}

describe("TalentsTab and TraitsTab, career/rank wiring into the picker", () => {
  it("passes career and rank down so a real Guardsman cost actually shows in the Talent picker", async () => {
    const user = userEvent.setup();
    render(
      <TalentsTab
        talents={makeTalents()}
        career="Guardsman"
        rank="Conscript"
        psychic={emptyPsychic}
        editable
        onUpdateTalents={vi.fn()}
      />
    );
    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    const dialog = screen.getByRole("dialog", { name: "Add Talent" });
    const card = within(dialog).getByText("Sound Constitution").closest("button");
    expect(within(card!).getByText("100 XP")).toBeInTheDocument();
  });

  it("does not show any real cost when no career is passed at all", async () => {
    const user = userEvent.setup();
    render(
      <TalentsTab
        talents={makeTalents()}
        psychic={emptyPsychic}
        editable
        onUpdateTalents={vi.fn()}
      />
    );
    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    const dialog = screen.getByRole("dialog", { name: "Add Talent" });
    const card = within(dialog).getByText("Sound Constitution").closest("button");
    expect(within(card!).queryByText(/XP$/)).not.toBeInTheDocument();
  });

  it("passes career and rank down into the Trait picker too", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TraitsTab
          talents={makeTalents()}
          career="Adept"
          rank="Sage Logister"
          editable
          onUpdateTalents={vi.fn()}
        />
      </ToastProvider>
    );
    await user.click(screen.getAllByRole("button", { name: "Add Trait" })[0]);
    const dialog = screen.getByRole("dialog", { name: "Add Trait" });
    const card = within(dialog).getByText("Unnatural Characteristic").closest("button");
    expect(card).toBeInTheDocument();
  });
});
