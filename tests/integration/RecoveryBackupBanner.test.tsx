// tests/integration/RecoveryBackupBanner.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const getRecoveryCodeMock = vi.fn();
const rotateRecoveryCodeMock = vi.fn();
vi.mock("../../src/services/identityService", () => ({
  getRecoveryCode: (...args: unknown[]) => getRecoveryCodeMock(...args),
  rotateRecoveryCode: (...args: unknown[]) => rotateRecoveryCodeMock(...args),
}));

const markRecoveryCodeBackedUpMock = vi.fn();
vi.mock("../../src/services/userAccountService", () => ({
  markRecoveryCodeBackedUp: (...args: unknown[]) => markRecoveryCodeBackedUpMock(...args),
}));

const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();
vi.mock("../../src/components/Toast", () => ({
  useToast: () => ({ error: mockToastError, success: mockToastSuccess }),
}));

import { RecoveryBackupBanner } from "../../src/components/RecoveryBackupBanner";

beforeEach(() => {
  vi.clearAllMocks();
});

function renderBanner(needsBackup = true) {
  render(
    <RecoveryBackupBanner ownUid="own-1" effectiveUserId="user-1" needsBackup={needsBackup} />
  );
}

describe("RecoveryBackupBanner", () => {
  it("renders nothing when backup isn't needed", () => {
    renderBanner(false);

    expect(screen.queryByText(/Back up your recovery code/)).not.toBeInTheDocument();
  });

  it("shows the banner and a Reveal button on the first render when backup is needed", () => {
    renderBanner();

    expect(screen.getByText(/Back up your recovery code/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reveal my code" })).toBeInTheDocument();
  });

  it("reveals the existing code without rotating when one already exists", async () => {
    const user = userEvent.setup();
    getRecoveryCodeMock.mockResolvedValue("DH-AAAA-BBBB");
    renderBanner();

    await user.click(screen.getByRole("button", { name: "Reveal my code" }));

    expect(await screen.findByText("DH-AAAA-BBBB")).toBeInTheDocument();
    expect(rotateRecoveryCodeMock).not.toHaveBeenCalled();
  });

  it("rotates to generate a code when none exists yet", async () => {
    const user = userEvent.setup();
    getRecoveryCodeMock.mockResolvedValue(null);
    rotateRecoveryCodeMock.mockResolvedValue("DH-CCCC-DDDD");
    renderBanner();

    await user.click(screen.getByRole("button", { name: "Reveal my code" }));

    expect(await screen.findByText("DH-CCCC-DDDD")).toBeInTheDocument();
    expect(rotateRecoveryCodeMock).toHaveBeenCalledWith("user-1");
  });

  it("requires Copy before I've saved it becomes enabled, then confirms", async () => {
    const user = userEvent.setup();
    getRecoveryCodeMock.mockResolvedValue("DH-AAAA-BBBB");
    markRecoveryCodeBackedUpMock.mockResolvedValue(undefined);
    renderBanner();

    await user.click(screen.getByRole("button", { name: "Reveal my code" }));
    await screen.findByText("DH-AAAA-BBBB");
    expect(screen.getByRole("button", { name: "I've saved it" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Copy" }));
    expect(screen.getByRole("button", { name: "I've saved it" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "I've saved it" }));
    expect(markRecoveryCodeBackedUpMock).toHaveBeenCalledWith("own-1");
    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledWith("Recovery code backed up."));
    expect(screen.queryByText(/Back up your recovery code/)).not.toBeInTheDocument();
  });
});
