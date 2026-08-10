// tests/integration/ExperienceTab.test.tsx
import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const { mockUseXpProposals } = vi.hoisted(() => ({
  mockUseXpProposals: vi.fn(() => ({ proposals: [], loading: false })),
}));

vi.mock("../../src/hooks/useXpProposals", () => ({
  useXpProposals: () => mockUseXpProposals(),
}));

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
        isOwnedByCurrentPlayer={false}
        isDM
        onUpdate={onUpdate}
        {...props}
      />
    </ToastProvider>
  );
  return { onUpdate };
}

beforeEach(() => {
  mockUseXpProposals.mockReturnValue({ proposals: [], loading: false });
});

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
});

// Regression coverage for the XP dual-write bug: approving a proposal moves
// experience.spent via increment() (see xpService.ts), a completely separate
// write path from these manual-advance handlers. Adding or removing an
// advance must fold the current approved-proposal total back in, not
// silently drop it by recomputing spent from ranks alone.
describe("ExperienceTab keeps approved-proposal spend when ranks change", () => {
  it("preserves an approved proposal's cost when adding a manual advance", async () => {
    mockUseXpProposals.mockReturnValue({
      proposals: [{ id: "p1", status: "approved", xpCost: 200, description: "Approved buy", playerId: "u1" }],
      loading: false,
    });
    const user = userEvent.setup();
    // spent already reflects the approved proposal's increment(200).
    const { onUpdate } = renderTab({ experience: { total: 1000, spent: 200, ranks: [] } });

    await user.type(screen.getByPlaceholderText("e.g. +10 Weapon Skill"), "+5 Ballistic Skill");
    const costInput = screen.getByDisplayValue("0");
    await user.clear(costInput);
    await user.type(costInput, "50");
    await user.click(screen.getByRole("button", { name: "Add" }));

    // 50 (this advance) + 200 (approved proposal), not just 50.
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ spent: 250 }));
  });

  it("preserves an approved proposal's cost when removing a manual advance", async () => {
    mockUseXpProposals.mockReturnValue({
      proposals: [{ id: "p1", status: "approved", xpCost: 200, description: "Approved buy", playerId: "u1" }],
      loading: false,
    });
    const user = userEvent.setup();
    const experience: ExperienceBlock = {
      total: 1000,
      spent: 350, // 150 (ranks below) + 200 (approved proposal)
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
    const { onUpdate } = renderTab({ experience, isDM: true });

    await user.click(screen.getAllByRole("button", { name: "Remove" })[0]);

    // 50 (remaining advance) + 200 (approved proposal), not 50 alone.
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ spent: 250 }));
  });

  it("ignores pending and rejected proposals when totalling approved spend", async () => {
    mockUseXpProposals.mockReturnValue({
      proposals: [
        { id: "p1", status: "pending", xpCost: 999, description: "Not yet", playerId: "u1" },
        { id: "p2", status: "rejected", xpCost: 999, description: "Denied", playerId: "u1" },
      ],
      loading: false,
    });
    const user = userEvent.setup();
    const { onUpdate } = renderTab({ experience: { total: 1000, spent: 0, ranks: [] } });

    await user.type(screen.getByPlaceholderText("e.g. +10 Weapon Skill"), "+5 Ballistic Skill");
    const costInput = screen.getByDisplayValue("0");
    await user.clear(costInput);
    await user.type(costInput, "50");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ spent: 50 }));
  });
});
