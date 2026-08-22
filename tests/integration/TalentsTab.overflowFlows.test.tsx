import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { useState } from "react";
import { TalentsTab } from "../../src/pages/characterSheet/TalentsTab";
import type { PsychicBlock, TalentsAndTraitsBlock } from "../../src/types/Character";

const emptyPsychic: PsychicBlock = { psyRating: 0, minorPowers: [], majorPowers: [] };

function makeTalents(): TalentsAndTraitsBlock {
  return { homeworld: "", talents: [], traits: [] };
}

// Neither "Touched by the Fates" nor "Minor Psychic Power" are on Guardsman's
// real career table at all, so for a Guardsman character they're only reachable
// through the overflow ("Show all") screen, never the normal ranks list.
function StatefulTalentsTab() {
  const [talents, setTalents] = useState(makeTalents());
  return (
    <TalentsTab
      talents={talents}
      career="Guardsman"
      rank="Conscript"
      psychic={emptyPsychic}
      editable
      isDM
      onUpdateTalents={setTalents}
      onUpdateCharacter={(partial) => {
        if (partial.talentsAndTraits) setTalents(partial.talentsAndTraits);
      }}
      willpowerBonus={5}
    />
  );
}

describe("TalentsTab, acquisition and Psychic-purchase flows through the overflow screen", () => {
  it("still triggers the acquisition flow for a talent bought through manual-cost on the overflow screen", async () => {
    const user = userEvent.setup();
    render(<StatefulTalentsTab />);
    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    await user.click(screen.getByRole("button", { name: "Show all" }));
    await user.click(screen.getByText("Touched by the Fates"));
    await user.type(screen.getByPlaceholderText("0"), "50");
    await user.click(screen.getByRole("button", { name: "Buy Touched by the Fates" }));

    expect(await screen.findByRole("dialog", { name: "Touched by the Fates Acquisition" })).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Apply and add Talent" }));

    expect(screen.getAllByText("Touched by the Fates").length).toBeGreaterThan(0);
  }, 10000);

  it("still supports linking a Psychic purchase bought through manual-cost on the overflow screen", async () => {
    const user = userEvent.setup();
    render(<StatefulTalentsTab />);
    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    await user.click(screen.getByRole("button", { name: "Show all" }));
    await user.click(screen.getByText("Minor Psychic Power"));
    await user.type(screen.getByPlaceholderText("0"), "100");
    await user.click(screen.getByRole("button", { name: "Buy Minor Psychic Power" }));

    await screen.findAllByText("Owned: 1");
    expect(screen.getAllByText("Owned: 1").length).toBeGreaterThan(0);
  });

  it("gives Faith Talents the same overflow screen, hidden until 'Show all', manual-cost only", async () => {
    const user = userEvent.setup();
    render(<StatefulTalentsTab />);
    await user.click(screen.getByRole("button", { name: "Add Faith Talent" }));
    const dialog = screen.getByRole("dialog", { name: "Add Faith Talent" });
    expect(within(dialog).queryByText("Blessed Ignorance")).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Show all" }));
    await user.click(within(dialog).getByText("Blessed Ignorance"));
    expect(screen.getByText("XP Cost")).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText("0"), "50");
    await user.click(screen.getByRole("button", { name: "Buy Blessed Ignorance" }));

    expect(screen.getAllByText("Blessed Ignorance").length).toBeGreaterThan(0);
  });
});
