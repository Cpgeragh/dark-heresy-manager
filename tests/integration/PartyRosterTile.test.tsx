import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

vi.mock("../../src/components/PortraitUpload", () => ({
  PortraitUpload: () => <div>Mock Portrait</div>,
}));

import { PartyRosterTile } from "../../src/pages/CampaignOverview/PartyRosterTile";
import type { CharacterSummaryWithId } from "../../src/types/Firestore";

function summary(over: Partial<CharacterSummaryWithId> = {}): CharacterSummaryWithId {
  return {
    id: "char-2",
    campaignId: "campaign-1",
    characterName: "Thrun",
    ...over,
  } as CharacterSummaryWithId;
}

describe("PartyRosterTile", () => {
  it("shows the character name", () => {
    render(<PartyRosterTile summary={summary()} />);
    expect(screen.getByText("Thrun")).toBeInTheDocument();
  });

  it("shows the player name when set", () => {
    render(<PartyRosterTile summary={summary({ playerName: "Sam" })} />);
    expect(screen.getByText("Sam")).toBeInTheDocument();
  });

  it("omits the player name line when not set", () => {
    render(<PartyRosterTile summary={summary()} />);
    expect(screen.queryByText("Sam")).not.toBeInTheDocument();
  });

  it("shows career and rank together when both are set", () => {
    render(<PartyRosterTile summary={summary({ career: "Cleric", rank: "Deacon" })} />);
    expect(screen.getByText("Cleric · Deacon")).toBeInTheDocument();
  });

  it("omits the career/rank line when neither is set", () => {
    render(<PartyRosterTile summary={summary()} />);
    expect(screen.queryByText(/·/)).not.toBeInTheDocument();
  });

  it("never renders a recovery code", () => {
    render(<PartyRosterTile summary={summary()} />);
    expect(screen.queryByText(/Recovery/)).not.toBeInTheDocument();
  });
});
