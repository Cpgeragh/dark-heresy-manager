import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { EntryCard } from "../../src/mechanics/talents/TalentEntryCards";
import type { TalentEntry } from "../../src/types/Character";
import type { CampaignCustomItem } from "../../src/types/CustomItems";

const plainEntry: TalentEntry = { uid: "t1", talentId: "unknown-trait", name: "Odd Trait" };

function renderCard(props: Partial<Parameters<typeof EntryCard>[0]> = {}) {
  return render(<EntryCard entry={plainEntry} editable onRemove={vi.fn()} {...props} />);
}

describe("EntryCard", () => {
  it("always shows its information icon and says when nothing was recorded", async () => {
    const user = userEvent.setup();
    renderCard();

    await user.click(screen.getByRole("button", { name: "Show information about Odd Trait" }));

    expect(screen.getByText("No description recorded.")).toBeInTheDocument();
  });

  it("shows a Gained from line for a granted entry, below the chips", () => {
    renderCard({
      entry: {
        ...plainEntry,
        grantedByTalentEntryUid: "g1",
        grantedByTalentName: "Cult Briefing",
        grantedByType: "Talent",
      },
      statusChip: "Owned: 2",
    });

    const label = screen.getByText("Gained from");
    expect(screen.getByText("Cult Briefing (Talent)")).toBeInTheDocument();
    const chip = screen.getByText("Owned: 2");
    expect(chip.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("shows the removal button without any nudge", () => {
    renderCard();

    expect(screen.getByRole("button", { name: "Remove Odd Trait" })).not.toHaveClass("mt-0.5");
  });

  it("shows the Draft or Published badge for a custom library Trait", () => {
    const libraryItem = {
      id: "c1",
      campaignId: "camp",
      category: "trait",
      status: "draft",
      name: "Odd Trait",
    } as unknown as CampaignCustomItem<"trait">;
    renderCard({ libraryItem });

    expect(screen.getByText("draft")).toBeInTheDocument();
  });
});
