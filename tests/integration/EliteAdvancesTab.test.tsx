import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";
import { EliteAdvancesTab } from "../../src/mechanics/eliteAdvances/EliteAdvancesTab";
import type {
  ExperienceBlock,
  InsanityBlock,
  SkillEntry,
  TalentsAndTraitsBlock,
} from "../../src/types/Character";

const EMPTY_TALENTS: TalentsAndTraitsBlock = {
  homeworld: "",
  talents: [],
  traits: [],
};
const EXPERIENCE: ExperienceBlock = {
  total: 3_000,
  spent: 2_000,
  ranks: [],
  alternateRanks: [
    {
      alternateRankId: "black-priest-of-maccabeus",
      replacedRankId: "preacher",
      takenAtTier: 4,
    },
  ],
};
const INSANITY: InsanityBlock = { points: 0, disorders: [] };

function EditableHarness() {
  const [talents, setTalents] = useState(EMPTY_TALENTS);
  const [skills, setSkills] = useState<SkillEntry[]>([]);
  const [insanity, setInsanity] = useState(INSANITY);
  return (
    <EliteAdvancesTab
      talents={talents}
      skills={skills}
      experience={EXPERIENCE}
      insanity={insanity}
      career="Cleric"
      rank="Preacher"
      editable
      onUpdateCharacter={async (partial) => {
        if (partial.talentsAndTraits) setTalents(partial.talentsAndTraits);
        if (partial.skills) setSkills(partial.skills);
        if (partial.insanity) setInsanity(partial.insanity);
        return true;
      }}
    />
  );
}

describe("EliteAdvancesTab", () => {
  it("purchases a packaged Elite Advance and records its rolls", async () => {
    const user = userEvent.setup();
    render(<EditableHarness />);

    expect(screen.getByText("No standalone Elite Advances purchased.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add Elite Advance" }));
    await user.click(screen.getByText("Special"));

    const picker = screen.getByRole("dialog", { name: "Add Special Elite Advance" });
    expect(within(picker).getByRole("button", { name: "Show all" })).toBeInTheDocument();
    expect(within(picker).getByText("Encarta Maleficarum")).toBeInTheDocument();
    expect(within(picker).getByText("500 XP")).toBeInTheDocument();

    await user.click(within(picker).getByText("Encarta Maleficarum"));
    const purchase = screen.getByRole("dialog", { name: "Buy Encarta Maleficarum" });
    await user.type(within(purchase).getByLabelText("Insanity gained (1d5)"), "1");
    await user.type(within(purchase).getByLabelText("Permanent Toughness reduction (1d5)"), "2");
    await user.type(within(purchase).getByLabelText("Permanent Fellowship reduction (1d5)"), "3");
    await user.click(within(purchase).getByRole("button", { name: "Buy for 500 XP" }));

    await user.click(screen.getByRole("button", { name: "Back" }));
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.getByText("Encarta Maleficarum")).toBeInTheDocument();
  });

  it("shows the complete supplied rules from a purchased card", async () => {
    const user = userEvent.setup();
    const talents: TalentsAndTraitsBlock = {
      ...EMPTY_TALENTS,
      eliteAdvances: [
        {
          uid: "encarta-entry",
          eliteAdvanceId: "encarta-maleficarum",
          name: "Encarta Maleficarum",
        },
      ],
    };
    render(
      <EliteAdvancesTab
        talents={talents}
        skills={[]}
        experience={EXPERIENCE}
        insanity={INSANITY}
        editable
        onUpdateCharacter={async () => true}
      />
    );

    await user.click(
      screen.getByRole("button", { name: "Show information about Encarta Maleficarum" })
    );
    const dialog = screen.getByRole("dialog", { name: "Encarta Maleficarum" });
    expect(within(dialog).getByText("1d5 weeks")).toBeInTheDocument();
    expect(within(dialog).getByText("Forbidden Lore (Ordos: Malleus)")).toBeInTheDocument();
    expect(within(dialog).getByText("Insanely Faithful")).toBeInTheDocument();
  });

  it("shows an Alternate Rank Elite Advance as granted and not removable", () => {
    const talents: TalentsAndTraitsBlock = {
      ...EMPTY_TALENTS,
      eliteAdvances: [
        {
          uid: "alternate-rank:malfian-bloodsworn:elite-advance:bloodsworn-charter",
          eliteAdvanceId: "bloodsworn-charter",
          name: "Bloodsworn Charter",
          grantedByAlternateRankId: "malfian-bloodsworn",
          grantedByAlternateRankName: "Malfian Bloodsworn",
        },
      ],
    };

    render(
      <EliteAdvancesTab
        talents={talents}
        skills={[]}
        experience={EXPERIENCE}
        insanity={INSANITY}
        editable
        onUpdateCharacter={async () => true}
      />
    );

    expect(screen.getByText("Bloodsworn Charter")).toBeInTheDocument();
    expect(screen.getByText("Malfian Bloodsworn (Alternate Rank): Granted")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete Bloodsworn Charter" })
    ).not.toBeInTheDocument();
    expect(screen.queryByText("0 XP")).not.toBeInTheDocument();
  });

  it("offers Special, Skill, and Talent purchase routes in one picker", async () => {
    const user = userEvent.setup();
    render(
      <EliteAdvancesTab
        talents={EMPTY_TALENTS}
        skills={[]}
        experience={{ total: 0, spent: 0, ranks: [] }}
        insanity={INSANITY}
        editable={false}
        onUpdateCharacter={async () => true}
      />
    );

    await user.click(screen.getByRole("button", { name: "View Elite Advances" }));
    const picker = screen.getByRole("dialog", { name: "View Elite Advances" });
    expect(within(picker).getByText("Special")).toBeInTheDocument();
    expect(within(picker).getByText("Skills")).toBeInTheDocument();
    expect(within(picker).getByText("Talents")).toBeInTheDocument();
  });

  it("does not offer automatic Alternate Rank grants through Special Show all", async () => {
    const user = userEvent.setup();
    render(
      <EliteAdvancesTab
        talents={EMPTY_TALENTS}
        skills={[]}
        experience={{ total: 0, spent: 0, ranks: [] }}
        insanity={INSANITY}
        editable={false}
        onUpdateCharacter={async () => true}
      />
    );

    await user.click(screen.getByRole("button", { name: "View Elite Advances" }));
    await user.click(screen.getByText("Special"));
    await user.click(screen.getByRole("button", { name: "Show all" }));

    expect(screen.getByText("Encarta Maleficarum")).toBeInTheDocument();
    expect(screen.queryByText("Bloodsworn Charter")).not.toBeInTheDocument();
  });

  it("shows the complete Talent catalogue through Show all", async () => {
    const user = userEvent.setup();
    render(
      <EliteAdvancesTab
        talents={EMPTY_TALENTS}
        skills={[]}
        experience={{ total: 0, spent: 0, ranks: [] }}
        insanity={INSANITY}
        editable={false}
        onUpdateCharacter={async () => true}
      />
    );

    await user.click(screen.getByRole("button", { name: "View Elite Advances" }));
    await user.click(screen.getByText("Talents"));
    await user.click(screen.getByRole("button", { name: "Show all" }));

    const picker = screen.getByRole("dialog", { name: "View Elite Advance Talents" });
    const pureFaith = within(picker)
      .getAllByText("Pure Faith")
      .map((element) => element.closest("button"))
      .find((button) => button?.textContent?.trim().startsWith("Pure Faith"));
    expect(pureFaith).toBeInTheDocument();
  });

  it("opens the normal acquisition form before saving an Elite Advance Talent", async () => {
    const user = userEvent.setup();
    const onUpdateCharacter = vi.fn(async () => true);
    render(
      <EliteAdvancesTab
        talents={EMPTY_TALENTS}
        skills={[]}
        experience={{ total: 0, spent: 0, ranks: [] }}
        insanity={INSANITY}
        willpowerBonus={4}
        isDM
        editable
        onUpdateCharacter={onUpdateCharacter}
      />
    );

    await user.click(screen.getByRole("button", { name: "Add Elite Advance" }));
    await user.click(screen.getByText("Talents"));
    await user.click(screen.getByRole("button", { name: "Show all" }));
    await user.click(screen.getByText("Touched by the Fates"));

    const costPicker = screen.getByRole("dialog", { name: "Buy Touched by the Fates" });
    await user.type(within(costPicker).getByRole("textbox"), "200");
    await user.click(within(costPicker).getByRole("button", { name: "Buy Touched by the Fates" }));

    expect(
      screen.getByRole("dialog", { name: "Touched by the Fates Acquisition" })
    ).toBeInTheDocument();
    expect(onUpdateCharacter).not.toHaveBeenCalled();
  });
});
