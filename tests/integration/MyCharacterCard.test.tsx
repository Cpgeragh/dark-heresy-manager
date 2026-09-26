import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";

vi.mock("../../src/components/PortraitUpload", () => ({
  PortraitUpload: () => <div>Mock Portrait</div>,
}));

const { mockRevealRecoveryCode, mockToastError } = vi.hoisted(() => ({
  mockRevealRecoveryCode: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock("../../src/services/characterService", () => ({
  revealRecoveryCode: mockRevealRecoveryCode,
}));

vi.mock("../../src/components/Toast", () => ({
  useToast: () => ({ error: mockToastError, success: vi.fn() }),
}));

import { MyCharacterCard } from "../../src/pages/CampaignOverview/MyCharacterCard";
import type { CharacterListItem } from "../../src/types/Firestore";

function character(over: Partial<CharacterListItem> = {}): CharacterListItem {
  return {
    id: "char-1",
    campaignId: "campaign-1",
    userId: "player-1",
    isEditableByPlayer: true,
    recoveryCode: "DH-AAAA-BBBB",
    header: { characterName: "Vex" },
    ...over,
  } as CharacterListItem;
}

beforeEach(() => {
  vi.clearAllMocks();
});

function renderCard(over: Partial<CharacterListItem> = {}) {
  render(
    <MemoryRouter>
      <MyCharacterCard character={character(over)} campaignId="campaign-1" />
    </MemoryRouter>
  );
}

describe("MyCharacterCard", () => {
  it("shows the character's name, career, and rank", () => {
    renderCard({ header: { characterName: "Vex", career: "Guardsman", rank: "Guard" } });
    expect(screen.getByText("Vex")).toBeInTheDocument();
    expect(screen.getByText("Guardsman · Guard")).toBeInTheDocument();
  });

  it("omits the career/rank line when neither is set", () => {
    renderCard({ header: { characterName: "Vex" } });
    expect(screen.queryByText(/·/)).not.toBeInTheDocument();
  });

  it("shows wounds and XP remaining when present", () => {
    renderCard({ wounds: { current: 8, total: 12 }, experience: { total: 500, spent: 300 } });
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument();
    expect(screen.getByText(/XP remaining/)).toBeInTheDocument();
  });

  it("does not show the recovery code until Reveal is clicked", () => {
    renderCard();
    expect(screen.getByRole("button", { name: "Reveal" })).toBeInTheDocument();
    expect(screen.queryByText(/DH-/)).not.toBeInTheDocument();
  });

  it("fetches and shows the code only after Reveal is clicked", async () => {
    const user = userEvent.setup();
    mockRevealRecoveryCode.mockResolvedValue("DH-ZZZZ-YYYY");
    renderCard();

    await user.click(screen.getByRole("button", { name: "Reveal" }));

    expect(mockRevealRecoveryCode).toHaveBeenCalledWith("campaign-1", "char-1");
    await waitFor(() => expect(screen.getByText("Recovery: DH-ZZZZ-YYYY")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "Reveal" })).not.toBeInTheDocument();
  });

  it("shows an error via toast when the reveal fails", async () => {
    const user = userEvent.setup();
    mockRevealRecoveryCode.mockRejectedValue(new Error("Network unreachable"));
    renderCard();

    await user.click(screen.getByRole("button", { name: "Reveal" }));

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith("Network unreachable"));
  });

  it("links to the character sheet", () => {
    renderCard();
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/campaign/campaign-1/character/char-1"
    );
  });
});
