import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CharacterKebabContent } from "../../src/pages/CharacterSheet/CharacterKebabContent";

const noop = () => {};

describe("CharacterKebabContent Recovery Code section", () => {
  it("shows the code, a copy button, and a revoke button when the caller can manage it", () => {
    render(
      <CharacterKebabContent
        recoveryCode="DH-TEST-0001"
        canManageRecoveryCode={true}
        onGenerateRecoveryCode={vi.fn()}
        onRevokeRecoveryCode={vi.fn()}
        canExport={false}
        onExport={noop}
        canPlayerRelease={false}
        onPlayerRelease={noop}
        isReleasing={false}
      />
    );
    expect(screen.getByText("DH-TEST-0001")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Revoke" })).toBeInTheDocument();
  });

  it("shows a Share button that opens a QR modal with the character's code URL", () => {
    render(
      <CharacterKebabContent
        recoveryCode="DH-TEST-0001"
        canManageRecoveryCode={true}
        onGenerateRecoveryCode={vi.fn()}
        onRevokeRecoveryCode={vi.fn()}
        canExport={false}
        onExport={noop}
        canPlayerRelease={false}
        onPlayerRelease={noop}
        isReleasing={false}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    expect(screen.getByText("Share Character")).toBeInTheDocument();
    expect(screen.getByText(`${window.location.origin}?code=DH-TEST-0001`)).toBeInTheDocument();
  });

  it("shows no Share button when there's no code", () => {
    render(
      <CharacterKebabContent
        recoveryCode=""
        canManageRecoveryCode={false}
        onGenerateRecoveryCode={vi.fn()}
        onRevokeRecoveryCode={vi.fn()}
        canExport={false}
        onExport={noop}
        canPlayerRelease={false}
        onPlayerRelease={noop}
        isReleasing={false}
      />
    );
    expect(screen.queryByRole("button", { name: "Share" })).not.toBeInTheDocument();
  });

  it("shows the code and a copy button, but no revoke button, when the caller cannot manage it", () => {
    render(
      <CharacterKebabContent
        recoveryCode="DH-TEST-0001"
        canManageRecoveryCode={false}
        onGenerateRecoveryCode={vi.fn()}
        onRevokeRecoveryCode={vi.fn()}
        canExport={false}
        onExport={noop}
        canPlayerRelease={false}
        onPlayerRelease={noop}
        isReleasing={false}
      />
    );
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Revoke" })).not.toBeInTheDocument();
  });

  it("shows a generate button when there's no code and the caller can manage it", () => {
    render(
      <CharacterKebabContent
        recoveryCode=""
        canManageRecoveryCode={true}
        onGenerateRecoveryCode={vi.fn()}
        onRevokeRecoveryCode={vi.fn()}
        canExport={false}
        onExport={noop}
        canPlayerRelease={false}
        onPlayerRelease={noop}
        isReleasing={false}
      />
    );
    expect(screen.getByText("This character has no Recovery Code yet.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generate Recovery Code" })).toBeInTheDocument();
  });

  it("shows nothing in this section when there's no code and the caller cannot manage it", () => {
    render(
      <CharacterKebabContent
        recoveryCode=""
        canManageRecoveryCode={false}
        onGenerateRecoveryCode={vi.fn()}
        onRevokeRecoveryCode={vi.fn()}
        canExport={false}
        onExport={noop}
        canPlayerRelease={false}
        onPlayerRelease={noop}
        isReleasing={false}
      />
    );
    expect(screen.queryByText(/Recovery Code/)).not.toBeInTheDocument();
  });

  it("calls onGenerateRecoveryCode when the generate button is clicked, and shows an error on failure", async () => {
    const onGenerate = vi.fn().mockRejectedValue(new Error("Failed to reach the server."));
    render(
      <CharacterKebabContent
        recoveryCode=""
        canManageRecoveryCode={true}
        onGenerateRecoveryCode={onGenerate}
        onRevokeRecoveryCode={vi.fn()}
        canExport={false}
        onExport={noop}
        canPlayerRelease={false}
        onPlayerRelease={noop}
        isReleasing={false}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Generate Recovery Code" }));
    expect(onGenerate).toHaveBeenCalledOnce();
    await waitFor(() => {
      expect(screen.getByText("Failed to reach the server.")).toBeInTheDocument();
    });
  });

  it("calls onRevokeRecoveryCode when the revoke button is clicked, and shows an error on failure", async () => {
    const onRevoke = vi.fn().mockRejectedValue(new Error("Failed to reach the server."));
    render(
      <CharacterKebabContent
        recoveryCode="DH-TEST-0001"
        canManageRecoveryCode={true}
        onGenerateRecoveryCode={vi.fn()}
        onRevokeRecoveryCode={onRevoke}
        canExport={false}
        onExport={noop}
        canPlayerRelease={false}
        onPlayerRelease={noop}
        isReleasing={false}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Revoke" }));
    expect(onRevoke).toHaveBeenCalledOnce();
    await waitFor(() => {
      expect(screen.getByText("Failed to reach the server.")).toBeInTheDocument();
    });
  });
});
