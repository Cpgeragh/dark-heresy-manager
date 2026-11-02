import { useState } from "react";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";
import { ElitePackagesTab } from "../../src/mechanics/eliteAdvances/ElitePackagesTab";
import { getSkillDefinition } from "../../src/utils/skillUtils";
import { openEntryCard } from "../utils/entryCard";
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
const NO_EXPERIENCE: ExperienceBlock = { total: 0, spent: 0, ranks: [] };
const INSANITY: InsanityBlock = { points: 0, disorders: [] };

function EditableHarness() {
  const [talents, setTalents] = useState(EMPTY_TALENTS);
  const [skills, setSkills] = useState<SkillEntry[]>([]);
  const [insanity, setInsanity] = useState(INSANITY);
  return (
    <ElitePackagesTab
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

describe("ElitePackagesTab", () => {
  it("purchases a packaged Elite Advance and records its rolls", async () => {
    const user = userEvent.setup();
    render(<EditableHarness />);

    expect(screen.getByText("No Elite Packages purchased.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add Elite Package" }));

    const picker = screen.getByRole("dialog", { name: "Add Elite Package" });
    expect(within(picker).getByRole("tab", { name: "Unlocked" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(within(picker).getByText("Encarta Maleficarum")).toBeInTheDocument();
    expect(within(picker).getByText("500 XP")).toBeInTheDocument();

    await user.click(within(picker).getByText("Encarta Maleficarum"));
    const purchase = screen.getByRole("dialog", { name: "Buy Encarta Maleficarum" });
    await user.type(within(purchase).getByLabelText("Insanity Gained (1d5)"), "1");
    await user.type(within(purchase).getByLabelText("Permanent Toughness Reduction (1d5)"), "2");
    await user.type(within(purchase).getByLabelText("Permanent Fellowship Reduction (1d5)"), "3");
    await user.click(within(purchase).getByRole("button", { name: "Buy for 500 XP" }));

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.getByText("Encarta Maleficarum")).toBeInTheDocument();
  });

  it("keeps the purchase dialog open with waiting dots until the save settles", async () => {
    const user = userEvent.setup();
    let settle: (saved: boolean) => void = () => {};
    const onUpdateCharacter = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          settle = resolve;
        })
    );
    render(
      <ElitePackagesTab
        talents={EMPTY_TALENTS}
        skills={[]}
        experience={EXPERIENCE}
        insanity={INSANITY}
        career="Cleric"
        rank="Preacher"
        editable
        onUpdateCharacter={onUpdateCharacter}
      />
    );

    await user.click(screen.getByRole("button", { name: "Add Elite Package" }));
    await user.click(screen.getByText("The Cult of the Red Redemption"));
    const purchase = screen.getByRole("dialog", { name: "Buy The Cult of the Red Redemption" });
    await user.click(within(purchase).getByRole("button", { name: "Buy for 150 XP" }));

    await waitFor(() => expect(purchase.querySelector('[aria-busy="true"]')).not.toBeNull());
    await act(async () => {
      settle(true);
    });
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Buy The Cult of the Red Redemption" })
      ).not.toBeInTheDocument()
    );
  });

  it("keeps the purchase dialog open when the server refuses the save", async () => {
    const user = userEvent.setup();
    let settle: (saved: boolean) => void = () => {};
    const onUpdateCharacter = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          settle = resolve;
        })
    );
    render(
      <ElitePackagesTab
        talents={EMPTY_TALENTS}
        skills={[]}
        experience={EXPERIENCE}
        insanity={INSANITY}
        career="Cleric"
        rank="Preacher"
        editable
        onUpdateCharacter={onUpdateCharacter}
      />
    );

    await user.click(screen.getByRole("button", { name: "Add Elite Package" }));
    await user.click(screen.getByText("The Cult of the Red Redemption"));
    const purchase = screen.getByRole("dialog", { name: "Buy The Cult of the Red Redemption" });
    await user.click(within(purchase).getByRole("button", { name: "Buy for 150 XP" }));
    await act(async () => {
      settle(false);
    });

    expect(
      screen.getByRole("dialog", { name: "Buy The Cult of the Red Redemption" })
    ).toBeInTheDocument();
    expect(purchase.querySelector('[aria-busy="true"]')).toBeNull();
  });

  it("purchases the Cult of the Red Redemption as a general package", async () => {
    const user = userEvent.setup();
    render(<EditableHarness />);

    await user.click(screen.getByRole("button", { name: "Add Elite Package" }));
    await user.click(screen.getByText("The Cult of the Red Redemption"));
    const purchase = screen.getByRole("dialog", {
      name: "Buy The Cult of the Red Redemption",
    });
    await user.click(within(purchase).getByRole("button", { name: "Buy for 150 XP" }));
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.getByText("The Cult of the Red Redemption")).toBeInTheDocument();
  });

  it("purchases Nascent Psyker for 0 XP and displays its permanent power grant", async () => {
    const user = userEvent.setup();
    render(<EditableHarness />);

    await user.click(screen.getByRole("button", { name: "Add Elite Package" }));
    await user.click(screen.getByText("Nascent Psyker"));
    const purchase = screen.getByRole("dialog", { name: "Buy Nascent Psyker" });
    expect(
      within(purchase).getByText("1 random permanent Minor Psychic Power")
    ).toBeInTheDocument();
    await user.click(within(purchase).getByRole("button", { name: "Buy for 0 XP" }));
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.getByText("Nascent Psyker")).toBeInTheDocument();
  });

  it("removes the Minor Power linked to a removed Nascent Psyker package", async () => {
    const user = userEvent.setup();
    const onUpdateCharacter = vi.fn(async () => true);
    render(
      <ElitePackagesTab
        talents={{
          ...EMPTY_TALENTS,
          eliteAdvances: [
            { uid: "nascent-entry", eliteAdvanceId: "nascent-psyker", name: "Nascent Psyker" },
          ],
        }}
        skills={[]}
        experience={NO_EXPERIENCE}
        insanity={INSANITY}
        psychic={{
          psyRating: 0,
          minorPowers: [
            {
              id: "minor-power",
              name: "Random Minor Power",
              known: true,
              talentEntryUid: "elite-advance:nascent-entry:minor-psychic-power:0",
            },
            { id: "unrelated", name: "Unrelated Power", known: true },
          ],
          majorPowers: [],
        }}
        editable
        onUpdateCharacter={onUpdateCharacter}
      />
    );

    await user.click(screen.getByRole("button", { name: "Remove Nascent Psyker" }));
    const confirmation = screen.getByRole("dialog", { name: "Remove Elite Advance" });
    await user.click(within(confirmation).getByRole("button", { name: "Remove" }));

    expect(onUpdateCharacter).toHaveBeenCalledWith(
      expect.objectContaining({
        talentsAndTraits: expect.objectContaining({ eliteAdvances: [] }),
        psychic: expect.objectContaining({
          minorPowers: [expect.objectContaining({ id: "unrelated" })],
        }),
      })
    );
  });

  it("keeps the Remove pop-up open when removing an Elite Advance is refused", async () => {
    const user = userEvent.setup();
    const onUpdateCharacter = vi.fn(async () => false);
    render(
      <ElitePackagesTab
        talents={{
          ...EMPTY_TALENTS,
          eliteAdvances: [
            { uid: "nascent-entry", eliteAdvanceId: "nascent-psyker", name: "Nascent Psyker" },
          ],
        }}
        skills={[]}
        experience={NO_EXPERIENCE}
        insanity={INSANITY}
        psychic={{ psyRating: 0, minorPowers: [], majorPowers: [] }}
        editable
        onUpdateCharacter={onUpdateCharacter}
      />
    );

    await user.click(screen.getByRole("button", { name: "Remove Nascent Psyker" }));
    const confirmation = screen.getByRole("dialog", { name: "Remove Elite Advance" });
    await user.click(within(confirmation).getByRole("button", { name: "Remove" }));

    await waitFor(() => expect(onUpdateCharacter).toHaveBeenCalledOnce());
    expect(screen.getByRole("dialog", { name: "Remove Elite Advance" })).toBeInTheDocument();
  });

  it("explains what to do before removing a package that a higher skill tier rests on", async () => {
    const user = userEvent.setup();
    const onUpdateCharacter = vi.fn(async () => true);
    const redemptionPurchase = {
      source: "elite-package" as const,
      cost: 100,
      sourceName: "The Cult of the Red Redemption",
      eliteAdvanceId: "cult-of-the-red-redemption",
    };
    render(
      <ElitePackagesTab
        talents={{
          ...EMPTY_TALENTS,
          eliteAdvances: [
            {
              uid: "redemption",
              eliteAdvanceId: "cult-of-the-red-redemption",
              name: "The Cult of the Red Redemption",
            },
          ],
        }}
        skills={[
          {
            ...getSkillDefinition("secret-tongue-redemption")!,
            level: "+20",
            eliteAdvancePurchases: { "+10": redemptionPurchase },
          },
        ]}
        experience={NO_EXPERIENCE}
        insanity={INSANITY}
        editable
        onUpdateCharacter={onUpdateCharacter}
      />
    );

    await user.click(screen.getByRole("button", { name: "Remove The Cult of the Red Redemption" }));

    expect(await screen.findByText(/Step 1: On the Skills page/)).toBeInTheDocument();
    expect(onUpdateCharacter).not.toHaveBeenCalled();
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
      <ElitePackagesTab
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
      <ElitePackagesTab
        talents={talents}
        skills={[]}
        experience={EXPERIENCE}
        insanity={INSANITY}
        editable
        onUpdateCharacter={async () => true}
      />
    );
    openEntryCard();

    expect(screen.getByText("Bloodsworn Charter")).toBeInTheDocument();
    expect(screen.getByText("Gained from")).toBeInTheDocument();
    expect(screen.getByText("Malfian Bloodsworn (Alternate Rank)")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remove Bloodsworn Charter" })
    ).not.toBeInTheDocument();
    expect(screen.queryByText("0 XP")).not.toBeInTheDocument();
  });

  it("opens on the Unlocked list and lists every other package under All", async () => {
    const user = userEvent.setup();
    render(
      <ElitePackagesTab
        talents={EMPTY_TALENTS}
        skills={[]}
        experience={NO_EXPERIENCE}
        insanity={INSANITY}
        editable={false}
        onUpdateCharacter={async () => true}
      />
    );

    await user.click(screen.getByRole("button", { name: "View Elite Packages" }));
    const picker = screen.getByRole("dialog", { name: "View Elite Packages" });
    expect(within(picker).getByRole("tab", { name: "Unlocked" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(within(picker).getByText("Nascent Psyker")).toBeInTheDocument();
    expect(within(picker).queryByText("Encarta Maleficarum")).not.toBeInTheDocument();

    await user.click(within(picker).getByRole("tab", { name: "All" }));

    expect(within(picker).getByText("Encarta Maleficarum")).toBeInTheDocument();
    expect(within(picker).queryByText("Nascent Psyker")).not.toBeInTheDocument();
    expect(within(picker).queryByText("Bloodsworn Charter")).not.toBeInTheDocument();
  });

  it("lets only the DM buy from the All list, and players still see it", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <ElitePackagesTab
        talents={EMPTY_TALENTS}
        skills={[]}
        experience={NO_EXPERIENCE}
        insanity={INSANITY}
        editable
        onUpdateCharacter={async () => true}
      />
    );

    await user.click(screen.getByRole("button", { name: "Add Elite Package" }));
    await user.click(screen.getByRole("tab", { name: "All" }));
    await user.click(screen.getByText("Encarta Maleficarum"));
    expect(
      screen.queryByRole("dialog", { name: "Buy Encarta Maleficarum" })
    ).not.toBeInTheDocument();
    unmount();

    render(
      <ElitePackagesTab
        talents={EMPTY_TALENTS}
        skills={[]}
        experience={NO_EXPERIENCE}
        insanity={INSANITY}
        isDM
        editable
        onUpdateCharacter={async () => true}
      />
    );
    await user.click(screen.getByRole("button", { name: "Add Elite Package" }));
    await user.click(screen.getByRole("tab", { name: "All" }));
    await user.click(screen.getByText("Encarta Maleficarum"));
    expect(screen.getByRole("dialog", { name: "Buy Encarta Maleficarum" })).toBeInTheDocument();
  });

  it("keeps the tab and the search text when the purchase screen closes", async () => {
    const user = userEvent.setup();
    render(
      <ElitePackagesTab
        talents={EMPTY_TALENTS}
        skills={[]}
        experience={NO_EXPERIENCE}
        insanity={INSANITY}
        isDM
        editable
        onUpdateCharacter={async () => true}
      />
    );

    await user.click(screen.getByRole("button", { name: "Add Elite Package" }));
    await user.click(screen.getByRole("tab", { name: "All" }));
    await user.type(screen.getByPlaceholderText("Search…"), "Enc");
    await user.click(screen.getByText("Encarta Maleficarum"));
    await user.click(
      within(screen.getByRole("dialog", { name: "Buy Encarta Maleficarum" })).getByRole("button", {
        name: "Close",
      })
    );

    expect(screen.getByRole("tab", { name: "All" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByPlaceholderText("Search…")).toHaveValue("Enc");
  });
});
