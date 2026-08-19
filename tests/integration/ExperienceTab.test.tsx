// tests/integration/ExperienceTab.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { ExperienceTab } from "../../src/pages/characterSheet/ExperienceTab";
import { ToastProvider } from "../../src/components/Toast";
import type { ExperienceBlock } from "../../src/types/Character";

function renderTab(props: Partial<React.ComponentProps<typeof ExperienceTab>> = {}) {
  const onUpdate = vi.fn();
  const experience: ExperienceBlock = { total: 1000, spent: 0, ranks: [] };
  render(
    <ToastProvider>
      <ExperienceTab
        experience={experience}
        campaignId="camp-1"
        characterId="char-1"
        isDM
        onUpdate={onUpdate}
        {...props}
      />
    </ToastProvider>
  );
  return { onUpdate };
}

describe("ExperienceTab DM add-advance form", () => {
  it("defaults to Rank 1 and adds an advance under that rank", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab();

    await user.type(screen.getByPlaceholderText("e.g. +10 Weapon Skill"), "+5 Ballistic Skill");
    const costInput = screen.getByDisplayValue("0");
    await user.clear(costInput);
    await user.type(costInput, "100");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        ranks: [expect.objectContaining({ rank: 1, advances: [expect.objectContaining({ name: "+5 Ballistic Skill", cost: 100 })] })],
      })
    );
  });

  it("switches rank via the Rank picker before adding an advance", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab();

    await user.click(screen.getByRole("button", { name: /Rank 1/ }));
    await user.click(screen.getByText("Rank 3"));
    await user.type(screen.getByPlaceholderText("e.g. +10 Weapon Skill"), "New Skill");
    const costInput = screen.getByDisplayValue("0");
    await user.clear(costInput);
    await user.type(costInput, "50");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        ranks: [expect.objectContaining({ rank: 3 })],
      })
    );
  });

  it("selects Elite rank via the Rank picker", async () => {
    const user = userEvent.setup();
    renderTab();
    await user.click(screen.getByRole("button", { name: /Rank 1/ }));
    await user.click(screen.getByText("Elite"));
    expect(screen.getByRole("button", { name: /Elite/ })).toBeInTheDocument();
  });

  it("removes an advance without touching spent, which is no longer written from here", async () => {
    const user = userEvent.setup();
    const experience: ExperienceBlock = {
      total: 1000,
      spent: 150,
      ranks: [
        {
          rank: 1,
          advances: [
            { id: "adv-1", name: "+5 Weapon Skill", cost: 100 },
            { id: "adv-2", name: "+5 Ballistic Skill", cost: 50 },
          ],
        },
      ],
    };
    const { onUpdate } = renderTab({ experience });

    await user.click(screen.getAllByRole("button", { name: "Remove" })[0]);

    const call = onUpdate.mock.calls[0][0];
    expect(call.ranks).toEqual([
      expect.objectContaining({ rank: 1, advances: [expect.objectContaining({ id: "adv-2" })] }),
    ]);
    // Carried through unchanged, not recalculated — the central sync effect
    // in CharacterSheet.tsx owns recomputing this now, not this handler.
    expect(call.spent).toBe(150);
  });
});
