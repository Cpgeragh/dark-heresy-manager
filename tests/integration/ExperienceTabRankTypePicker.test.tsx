import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

vi.mock("../../src/data/reference/alternateRankData", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../src/data/reference/alternateRankData")>();
  const template = actual.ALTERNATE_RANKS[0];
  return {
    ...actual,
    ALTERNATE_RANKS: [
      ...actual.ALTERNATE_RANKS,
      {
        ...template,
        id: "second-cleric-alternate",
        name: "Second Cleric Alternative",
        advances: [],
      },
    ],
  };
});

import { ExperienceTab } from "../../src/pages/CharacterSheet/ExperienceTab";
import type { Character } from "../../src/types/Character";
import { createEmptyCharacterData } from "../../src/utils/characterFactory";

function makeCleric(rank: string, spent: number): Character {
  const character = createEmptyCharacterData({
    campaignId: "campaign",
    recoveryCode: "recovery",
  });
  return {
    ...character,
    id: "cleric-character",
    header: {
      ...character.header,
      career: "Cleric",
      rank,
      careerPath: undefined,
    },
    experience: { total: spent, spent, ranks: [] },
  };
}

function renderTab(character: Character) {
  const onUpdateCharacter = vi.fn().mockResolvedValue(true);
  render(
    <ExperienceTab
      character={character}
      isDM
      editable
      onUpdate={vi.fn().mockResolvedValue(true)}
      onUpdateCharacter={onUpdateCharacter}
    />
  );
  return onUpdateCharacter;
}

describe("ExperienceTab Rank type picker", () => {
  it("opens the standard closeable picker directly at a non-branching Rank with two alternatives", async () => {
    const user = userEvent.setup();
    const onUpdateCharacter = renderTab(makeCleric("Priest", 2_000));

    await user.click(screen.getByRole("button", { name: "Rank Up" }));
    const picker = within(screen.getByRole("dialog", { name: "Choose Rank Type" }));
    expect(picker.getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(picker.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
    expect(picker.getByRole("button", { name: "Preacher" })).toBeInTheDocument();
    expect(picker.getByRole("button", { name: "Black Priest of Maccabeus" })).toBeInTheDocument();
    expect(picker.getByRole("button", { name: "Second Cleric Alternative" })).toBeInTheDocument();

    await user.click(picker.getByRole("button", { name: "Second Cleric Alternative" }));
    const confirmation = within(screen.getByRole("dialog", { name: "Confirm Rank Up" }));
    expect(
      confirmation.getByRole("button", { name: "Second Cleric Alternative" })
    ).toBeInTheDocument();
    expect(
      confirmation.queryByRole("button", { name: "Black Priest of Maccabeus" })
    ).not.toBeInTheDocument();

    await user.click(confirmation.getByRole("button", { name: "Confirm Rank Up" }));
    expect(onUpdateCharacter).toHaveBeenCalledWith(
      expect.objectContaining({
        experience: expect.objectContaining({
          alternateRanks: [
            expect.objectContaining({
              alternateRankId: "second-cleric-alternate",
              replacedRankId: "preacher",
            }),
          ],
        }),
      })
    );
  });

  it("opens the Rank type picker after a Career path is chosen at a branch", async () => {
    const user = userEvent.setup();
    renderTab(makeCleric("Cleric", 6_000));

    await user.click(screen.getByRole("button", { name: "Rank Up" }));
    const confirmation = within(screen.getByRole("dialog", { name: "Confirm Rank Up" }));
    expect(screen.queryByRole("dialog", { name: "Choose Rank Type" })).not.toBeInTheDocument();

    await user.click(confirmation.getByRole("button", { name: "Exorcist" }));
    const picker = within(screen.getByRole("dialog", { name: "Choose Rank Type" }));
    expect(picker.getByRole("button", { name: "Exorcist" })).toBeInTheDocument();
    expect(picker.getByRole("button", { name: "Black Priest of Maccabeus" })).toBeInTheDocument();
    expect(picker.getByRole("button", { name: "Second Cleric Alternative" })).toBeInTheDocument();
  });
});
