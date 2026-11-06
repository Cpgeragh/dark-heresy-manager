import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";
import { EliteSkillsTab } from "../../src/mechanics/eliteAdvances/EliteSkillsTab";
import type {
  CharField,
  Characteristics,
  EliteAdvancePurchase,
  ExperienceBlock,
  SkillEntry,
  TalentsAndTraitsBlock,
} from "../../src/types/Character";
import { getSkillDefinition } from "../../src/utils/skillUtils";
import { openAllEntryCards } from "../utils/entryCard";
import { findPickerRow, getPickerRow } from "../utils/pickerRow";

const getCharField = (_key: keyof Characteristics): CharField => ({ base: 30, advances: 0 });
const NO_EXPERIENCE: ExperienceBlock = { total: 0, spent: 0, ranks: [] };
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

function secretTongue(level: SkillEntry["level"], extra: Partial<SkillEntry> = {}): SkillEntry {
  return { ...getSkillDefinition("secret-tongue-redemption")!, level, ...extra };
}

const TWO_TIERS = secretTongue("+10", {
  xpPurchases: { trained: { cost: 100 } as never, "+10": { cost: 100 } as never },
  eliteAdvancePurchases: { trained: CULT, "+10": CULT },
});

function renderTab(props: Partial<React.ComponentProps<typeof EliteSkillsTab>> = {}) {
  const onUpdateCharacter = vi.fn(async () => true);
  render(
    <EliteSkillsTab
      skills={[]}
      talents={EMPTY_TALENTS}
      experience={NO_EXPERIENCE}
      editable
      getCharField={getCharField}
      onUpdateCharacter={onUpdateCharacter}
      {...props}
    />
  );
  return { onUpdateCharacter };
}

describe("EliteSkillsTab owned cards", () => {
  it("shows one card for each Elite-bought tier, like the skill card but with no Upgrade or Downgrade", () => {
    renderTab({ skills: [TWO_TIERS], talents: WITH_CULT });

    expect(screen.getAllByText("Secret Tongue (the Redemption)")).toHaveLength(2);
    openAllEntryCards();
    expect(screen.getAllByText("Trained")).not.toHaveLength(0);
    expect(screen.getAllByText("+10")).not.toHaveLength(0);
    expect(screen.getAllByText("The Cult of the Red Redemption (Elite Advance)")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /Upgrade/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Downgrade/ })).not.toBeInTheDocument();
  });

  it("explains what to do before a lower tier can be removed", async () => {
    const user = userEvent.setup();
    const { onUpdateCharacter } = renderTab({ skills: [TWO_TIERS], talents: WITH_CULT });

    await user.click(
      screen.getAllByRole("button", { name: "Remove Secret Tongue (the Redemption)" })[0]
    );

    expect(await screen.findByText(/Step 1:/)).toBeInTheDocument();
    expect(onUpdateCharacter).not.toHaveBeenCalled();
  });

  it("removes only the top Elite tier after confirmation", async () => {
    const user = userEvent.setup();
    const { onUpdateCharacter } = renderTab({ skills: [TWO_TIERS], talents: EMPTY_TALENTS });

    await user.click(
      screen.getAllByRole("button", { name: "Remove Secret Tongue (the Redemption)" })[1]
    );
    await user.click(
      within(screen.getByRole("dialog", { name: "Remove Skill" })).getByRole("button", {
        name: "Remove",
      })
    );

    expect(onUpdateCharacter).toHaveBeenCalledWith({
      skills: [expect.objectContaining({ level: "trained" })],
    });
  });
});

describe("EliteSkillsTab pop-up", () => {
  it("buys an Unlocked skill on tap with no confirmation", async () => {
    const user = userEvent.setup();
    const { onUpdateCharacter } = renderTab({ talents: WITH_CULT });

    await user.click(screen.getByRole("button", { name: "Add Elite Skill" }));
    const picker = screen.getByRole("dialog", { name: "Add Elite Skill" });
    expect(within(picker).getByRole("tab", { name: "Unlocked" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(within(picker).getByText("100 XP")).toBeInTheDocument();
    await user.click(getPickerRow(picker, "Secret Tongue (the Redemption)"));

    expect(onUpdateCharacter).toHaveBeenCalledWith({
      skills: [
        expect.objectContaining({
          id: "secret-tongue-redemption",
          level: "+10",
          eliteAdvancePurchases: {
            "+10": expect.objectContaining({
              source: "elite-package",
              eliteAdvanceId: "cult-of-the-red-redemption",
            }),
          },
        }),
      ],
    });
  });

  it("leaves what Unlocked offers out of the All list", async () => {
    const user = userEvent.setup();
    renderTab({ talents: WITH_CULT, isDM: true });

    await user.click(screen.getByRole("button", { name: "Add Elite Skill" }));
    await user.click(screen.getByRole("tab", { name: "All" }));
    const picker = screen.getByRole("dialog", { name: "Add Elite Skill" });

    expect(getPickerRow(picker, "Acrobatics")).toBeInTheDocument();
    expect(findPickerRow(picker, "Secret Tongue (the Redemption)")).toBeUndefined();
  });

  it("lets players look at the All list but not buy from it", async () => {
    const user = userEvent.setup();
    const { onUpdateCharacter } = renderTab();

    await user.click(screen.getByRole("button", { name: "Add Elite Skill" }));
    await user.click(screen.getByRole("tab", { name: "All" }));
    await user.click(screen.getByText("Acrobatics"));

    expect(screen.queryByRole("dialog", { name: "Buy Acrobatics" })).not.toBeInTheDocument();
    expect(onUpdateCharacter).not.toHaveBeenCalled();
  });

  it("lets the DM buy a skill from All for a typed cost", async () => {
    const user = userEvent.setup();
    const { onUpdateCharacter } = renderTab({ isDM: true });

    await user.click(screen.getByRole("button", { name: "Add Elite Skill" }));
    await user.click(screen.getByRole("tab", { name: "All" }));
    await user.click(screen.getByText("Acrobatics"));
    const costForm = screen.getByRole("dialog", { name: "Buy Acrobatics" });
    await user.type(within(costForm).getByRole("textbox"), "0");
    await user.click(within(costForm).getByRole("button", { name: "Buy Acrobatics" }));

    expect(onUpdateCharacter).toHaveBeenCalledWith({
      skills: [
        expect.objectContaining({
          id: "acrobatics",
          level: "trained",
          xpPurchases: { trained: expect.objectContaining({ cost: 0 }) },
          eliteAdvancePurchases: {
            trained: expect.objectContaining({ source: "gm-approved", cost: 0 }),
          },
        }),
      ],
    });
  });
});
