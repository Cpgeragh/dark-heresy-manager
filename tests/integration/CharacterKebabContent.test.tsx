import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CharacterKebabContent } from "../../src/pages/characterSheet/CharacterKebabContent";

const noop = () => {};

describe("CharacterKebabContent Recovery Code section", () => {
  it("shows the code and a copy button when one exists", () => {
    render(
      <CharacterKebabContent
        recoveryCode="DH-TEST-0001"
        canGenerateRecoveryCode={false}
        onGenerateRecoveryCode={vi.fn()}
        canExport={false}
        onExport={noop}
        canPlayerRelease={false}
        onPlayerRelease={noop}
        isReleasing={false}
      />
    );
    expect(screen.getByText("DH-TEST-0001")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });

  it("shows a generate button when there's no code and the caller can generate one", () => {
    render(
      <CharacterKebabContent
        recoveryCode=""
        canGenerateRecoveryCode={true}
        onGenerateRecoveryCode={vi.fn()}
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

  it("shows nothing in this section when there's no code and the caller cannot generate one", () => {
    render(
      <CharacterKebabContent
        recoveryCode=""
        canGenerateRecoveryCode={false}
        onGenerateRecoveryCode={vi.fn()}
        canExport={false}
        onExport={noop}
        canPlayerRelease={false}
        onPlayerRelease={noop}
        isReleasing={false}
      />
    );
    expect(screen.queryByText(/Recovery Code/)).not.toBeInTheDocument();
  });

  it("calls onGenerateRecoveryCode when the button is clicked, and shows an error on failure", async () => {
    const onGenerate = vi.fn().mockRejectedValue(new Error("Failed to reach the server."));
    render(
      <CharacterKebabContent
        recoveryCode=""
        canGenerateRecoveryCode={true}
        onGenerateRecoveryCode={onGenerate}
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
});
