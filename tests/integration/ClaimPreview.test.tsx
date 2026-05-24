import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ClaimPreview } from "../../src/pages/ClaimCharacter/ClaimPreview";

const mockCharacter = {
  id: "char-123",
  header: { characterName: "Brother Corvus" },
} as any;

const mockCampaign = {
  name: "The Calixis Conspiracy",
  dmId: "dm-uid",
} as any;

describe("ClaimPreview", () => {
  it("renders character and campaign name", () => {
    render(
      <ClaimPreview
        character={mockCharacter}
        campaign={mockCampaign}
        ownership="unclaimed"
        onClaim={vi.fn()}
      />
    );
    expect(screen.getByText("Brother Corvus")).toBeInTheDocument();
    expect(screen.getByText("The Calixis Conspiracy")).toBeInTheDocument();
  });

  it("shows available message and enabled button when unclaimed", () => {
    render(
      <ClaimPreview
        character={mockCharacter}
        campaign={mockCampaign}
        ownership="unclaimed"
        onClaim={vi.fn()}
      />
    );
    expect(screen.getByText(/unclaimed and available/i)).toBeInTheDocument();
    expect(screen.getByRole("button")).not.toBeDisabled();
    expect(screen.getByRole("button")).toHaveTextContent("Claim This Character");
  });

  it("shows already owned message and disabled button when claimed-by-you", () => {
    render(
      <ClaimPreview
        character={mockCharacter}
        campaign={mockCampaign}
        ownership="claimed-by-you"
        onClaim={vi.fn()}
      />
    );
    expect(screen.getByText(/you already own/i)).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("shows claimed message and disabled button when claimed-by-other", () => {
    render(
      <ClaimPreview
        character={mockCharacter}
        campaign={mockCampaign}
        ownership="claimed-by-other"
        onClaim={vi.fn()}
      />
    );
    expect(screen.getByText(/claimed by another player/i)).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("shows locked message and disabled button when locked", () => {
    render(
      <ClaimPreview
        character={mockCharacter}
        campaign={mockCampaign}
        ownership="locked"
        onClaim={vi.fn()}
      />
    );
    expect(screen.getByText(/locked by the dm/i)).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("calls onClaim when claim button clicked", () => {
    const onClaim = vi.fn();
    render(
      <ClaimPreview
        character={mockCharacter}
        campaign={mockCampaign}
        ownership="unclaimed"
        onClaim={onClaim}
      />
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onClaim).toHaveBeenCalledOnce();
  });

  it("does not call onClaim when character is already claimed", () => {
    const onClaim = vi.fn();
    render(
      <ClaimPreview
        character={mockCharacter}
        campaign={mockCampaign}
        ownership="claimed-by-other"
        onClaim={onClaim}
      />
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onClaim).not.toHaveBeenCalled();
  });

  it("falls back to Unnamed Character when no characterName", () => {
    render(
      <ClaimPreview
        character={{ ...mockCharacter, header: {} }}
        campaign={mockCampaign}
        ownership="unclaimed"
        onClaim={vi.fn()}
      />
    );
    expect(screen.getByText("Unnamed Character")).toBeInTheDocument();
  });
});
