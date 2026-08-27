import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";

vi.mock("../../src/components/PortraitUpload", () => ({
  PortraitUpload: () => <div>Mock Portrait</div>,
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

  it("shows the character's own recovery code", () => {
    renderCard({ recoveryCode: "DH-ZZZZ-YYYY" });
    expect(screen.getByText(/DH-ZZZZ-YYYY/)).toBeInTheDocument();
  });

  it("links to the character sheet", () => {
    renderCard();
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/campaign/campaign-1/character/char-1"
    );
  });
});
