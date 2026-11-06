import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";
import { EliteTalentsTab } from "../../src/mechanics/eliteAdvances/EliteTalentsTab";
import type {
  EliteAdvancePurchase,
  ExperienceBlock,
  InsanityBlock,
  TalentsAndTraitsBlock,
} from "../../src/types/Character";
import { findPickerRow, getPickerRow } from "../utils/pickerRow";

const NO_EXPERIENCE: ExperienceBlock = { total: 0, spent: 0, ranks: [] };
const INSANITY: InsanityBlock = { points: 0, disorders: [] };
const EMPTY_TALENTS: TalentsAndTraitsBlock = { homeworld: "", talents: [], traits: [] };
const WITH_CULT: TalentsAndTraitsBlock = {
  ...EMPTY_TALENTS,
  eliteAdvances: [
    {
      uid: "redemption",
      eliteAdvanceId: "cult-of-the-red-redemption",
      name: "The Cult of the Red Redemption",
    },
  ],
};
const CULT: EliteAdvancePurchase = {
  source: "elite-package",
  cost: 100,
  sourceName: "The Cult of the Red Redemption",
  eliteAdvanceId: "cult-of-the-red-redemption",
};

function renderTab(props: Partial<React.ComponentProps<typeof EliteTalentsTab>> = {}) {
  const onUpdateCharacter = vi.fn(async () => true);
  render(
    <EliteTalentsTab
      talents={EMPTY_TALENTS}
      skills={[]}
      experience={NO_EXPERIENCE}
      insanity={INSANITY}
      editable
      onUpdateCharacter={onUpdateCharacter}
      {...props}
    />
  );
  return { onUpdateCharacter };
}

describe("EliteTalentsTab owned cards", () => {
  it("shows an Elite-bought talent and removes it after confirmation", async () => {
    const user = userEvent.setup();
    const { onUpdateCharacter } = renderTab({
      talents: {
        ...EMPTY_TALENTS,
        talents: [
          {
            uid: "hatred",
            talentId: "hatred",
            name: "Hatred (Heretics)",
            specialisation: "Heretics",
            eliteAdvancePurchase: CULT,
          },
          { uid: "other", talentId: "flagellant", name: "Flagellant" },
        ],
      },
    });

    expect(screen.getByText("Hatred (Heretics)")).toBeInTheDocument();
    expect(screen.queryByText("Flagellant")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove Hatred (Heretics)" }));
    await user.click(
      within(screen.getByRole("dialog", { name: "Remove Talent" })).getByRole("button", {
        name: "Remove",
      })
    );

    expect(onUpdateCharacter).toHaveBeenCalledWith(
      expect.objectContaining({
        talentsAndTraits: expect.objectContaining({
          talents: [expect.objectContaining({ uid: "other" })],
        }),
      })
    );
  });

  it("shows an Elite-bought weapon training group and removes only that group", async () => {
    const user = userEvent.setup();
    const { onUpdateCharacter } = renderTab({
      weaponTraining: {
        trained: ["basic-flame", "basic-las"],
        exoticWeapons: [],
        eliteAdvancePurchases: { "basic-flame": CULT },
      },
    });

    expect(screen.getByText("Basic Weapon Training (Flame)")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove Basic Weapon Training (Flame)" }));
    await user.click(
      within(screen.getByRole("dialog", { name: "Remove Talent" })).getByRole("button", {
        name: "Remove",
      })
    );

    expect(onUpdateCharacter).toHaveBeenCalledWith({
      weaponTraining: expect.objectContaining({ trained: ["basic-las"] }),
    });
  });

  it("explains how to free a talent that is linked to psychic powers", async () => {
    const user = userEvent.setup();
    const { onUpdateCharacter } = renderTab({
      talents: {
        ...EMPTY_TALENTS,
        talents: [
          {
            uid: "linked",
            talentId: "hatred",
            name: "Hatred (Mutants)",
            eliteAdvancePurchase: CULT,
          },
        ],
      },
      psychic: {
        psyRating: 1,
        minorPowers: [{ id: "p", name: "Power", known: true, psyRatingTalentEntryUid: "linked" }],
        majorPowers: [],
      },
    });

    await user.click(screen.getByRole("button", { name: "Remove Hatred (Mutants)" }));

    expect(
      await screen.findByText(/Remove those powers on the Psychic page first/)
    ).toBeInTheDocument();
    expect(onUpdateCharacter).not.toHaveBeenCalled();
  });
});

describe("EliteTalentsTab pop-up", () => {
  it("buys an Unlocked weapon training group on tap", async () => {
    const user = userEvent.setup();
    const { onUpdateCharacter } = renderTab({
      talents: WITH_CULT,
      weaponTraining: { trained: [], exoticWeapons: [] },
      career: "Adept",
      rank: "Scribe",
    });

    await user.click(screen.getByRole("button", { name: "Add Elite Talent" }));
    const picker = screen.getByRole("dialog", { name: "Add Elite Talent" });
    expect(within(picker).getByRole("tab", { name: "Unlocked" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await user.click(getPickerRow(picker, "Basic Weapon Training (Flame)"));

    expect(onUpdateCharacter).toHaveBeenCalledWith({
      weaponTraining: expect.objectContaining({
        trained: ["basic-flame"],
        xpPurchases: { "basic-flame": expect.objectContaining({ cost: 200 }) },
        eliteAdvancePurchases: {
          "basic-flame": expect.objectContaining({
            source: "elite-package",
            eliteAdvanceId: "cult-of-the-red-redemption",
          }),
        },
      }),
    });
  });

  it("keeps what Unlocked offers out of All, and hides the Unlocked choices inside a talent with choices", async () => {
    const user = userEvent.setup();
    renderTab({ talents: WITH_CULT, isDM: true });

    await user.click(screen.getByRole("button", { name: "Add Elite Talent" }));
    await user.click(screen.getByRole("tab", { name: "All" }));
    const picker = screen.getByRole("dialog", { name: "Add Elite Talent" });
    expect(getPickerRow(picker, "Pure Faith")).toBeInTheDocument();
    expect(findPickerRow(picker, "Battle Rage")).toBeUndefined();

    await user.click(getPickerRow(picker, "Hatred"));

    expect(screen.queryByText("Heretics")).not.toBeInTheDocument();
    expect(screen.getByText("Daemons")).toBeInTheDocument();
  });

  it("lets players look at the All list but not buy from it", async () => {
    const user = userEvent.setup();
    const { onUpdateCharacter } = renderTab();

    await user.click(screen.getByRole("button", { name: "Add Elite Talent" }));
    await user.click(screen.getByRole("tab", { name: "All" }));
    await user.click(screen.getByText("Air of Authority"));

    expect(screen.queryByRole("dialog", { name: "Buy Air of Authority" })).not.toBeInTheDocument();
    expect(onUpdateCharacter).not.toHaveBeenCalled();
  });

  it("opens the normal acquisition form before a DM-priced talent is saved", async () => {
    const user = userEvent.setup();
    const { onUpdateCharacter } = renderTab({ isDM: true, willpowerBonus: 4 });

    await user.click(screen.getByRole("button", { name: "Add Elite Talent" }));
    await user.click(screen.getByRole("tab", { name: "All" }));
    await user.click(screen.getByText("Touched by the Fates"));
    const costForm = screen.getByRole("dialog", { name: "Buy Touched by the Fates" });
    await user.type(within(costForm).getByRole("textbox"), "200");
    await user.click(within(costForm).getByRole("button", { name: "Buy Touched by the Fates" }));

    expect(
      screen.getByRole("dialog", { name: "Touched by the Fates Acquisition" })
    ).toBeInTheDocument();
    expect(onUpdateCharacter).not.toHaveBeenCalled();
  });

  it("lets the DM buy an All-list talent for 0 XP", async () => {
    const user = userEvent.setup();
    const { onUpdateCharacter } = renderTab({ isDM: true });

    await user.click(screen.getByRole("button", { name: "Add Elite Talent" }));
    await user.click(screen.getByRole("tab", { name: "All" }));
    await user.click(screen.getByText("Air of Authority"));
    const costForm = screen.getByRole("dialog", { name: "Buy Air of Authority" });
    await user.type(within(costForm).getByRole("textbox"), "0");
    await user.click(within(costForm).getByRole("button", { name: "Buy Air of Authority" }));

    expect(onUpdateCharacter).toHaveBeenCalledWith(
      expect.objectContaining({
        talentsAndTraits: expect.objectContaining({
          talents: [
            expect.objectContaining({
              talentId: "air-of-authority",
              xpPurchase: expect.objectContaining({ cost: 0 }),
              eliteAdvancePurchase: expect.objectContaining({ source: "gm-approved" }),
            }),
          ],
        }),
      })
    );
  });
});
