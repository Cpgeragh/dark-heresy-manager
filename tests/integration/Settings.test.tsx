// tests/integration/Settings.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const getRecoveryCodeMock = vi.fn();
const rotateRecoveryCodeMock = vi.fn();
const revokeIdentityRecoveryCodeMock = vi.fn();
vi.mock("../../src/services/identityService", () => ({
  getRecoveryCode: (...args: unknown[]) => getRecoveryCodeMock(...args),
  rotateRecoveryCode: (...args: unknown[]) => rotateRecoveryCodeMock(...args),
  revokeIdentityRecoveryCode: (...args: unknown[]) => revokeIdentityRecoveryCodeMock(...args),
}));

const deleteCurrentAccountMock = vi.fn();
vi.mock("../../src/services/userAccountService", () => ({
  deleteCurrentAccount: (...args: unknown[]) => deleteCurrentAccountMock(...args),
}));
vi.mock("../../src/services/deviceLinkService", () => ({
  LastDeviceDisconnectError: class LastDeviceDisconnectError extends Error {},
}));

const saveFirstNameMock = vi.fn();
vi.mock("../../src/services/profileService", () => ({
  saveFirstName: (...args: unknown[]) => saveFirstNameMock(...args),
}));

const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();
vi.mock("../../src/components/Toast", () => ({
  useToast: () => ({ error: mockToastError, success: mockToastSuccess }),
}));

import Settings from "../../src/pages/Settings";

beforeEach(() => {
  vi.clearAllMocks();
});

function renderSettings(props: Partial<React.ComponentProps<typeof Settings>> = {}) {
  const disconnect = vi.fn().mockResolvedValue(undefined);
  render(
    <Settings effectiveUserId="user-1" firstName="Alice" disconnect={disconnect} {...props} />
  );
  return { disconnect };
}

describe("Settings display name", () => {
  it("pre-fills the input with the current first name", () => {
    renderSettings();
    expect(screen.getByPlaceholderText("e.g. David")).toHaveValue("Alice");
  });

  it("disables Save until the draft actually changes", () => {
    renderSettings();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("saves a changed name and shows a success toast", async () => {
    const user = userEvent.setup();
    saveFirstNameMock.mockResolvedValue(undefined);
    renderSettings();

    const input = screen.getByPlaceholderText("e.g. David");
    await user.clear(input);
    await user.type(input, "Cain");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(saveFirstNameMock).toHaveBeenCalledWith("user-1", "Cain");
    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledWith("Display name updated."));
  });

  it("strips spaces as they're typed", async () => {
    const user = userEvent.setup();
    renderSettings();

    const input = screen.getByPlaceholderText("e.g. David");
    await user.clear(input);
    await user.type(input, "Cain Marko");

    expect(input).toHaveValue("CainMarko");
  });

  it("capitalizes the first letter as it is typed", async () => {
    const user = userEvent.setup();
    renderSettings();

    const input = screen.getByPlaceholderText("e.g. David");
    await user.clear(input);
    await user.type(input, "cormac");

    expect(input).toHaveValue("Cormac");
  });

  it("shows an error when saving fails", async () => {
    const user = userEvent.setup();
    saveFirstNameMock.mockRejectedValue(new Error("network"));
    renderSettings();

    const input = screen.getByPlaceholderText("e.g. David");
    await user.clear(input);
    await user.type(input, "Cain");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(screen.getByText("Failed to save display name. Please try again.")).toBeInTheDocument()
    );
  });
});

describe("Settings recovery code", () => {
  it("reveals an existing code without generating a new one", async () => {
    const user = userEvent.setup();
    getRecoveryCodeMock.mockResolvedValue("DH-AAAA-BBBB");
    renderSettings();

    await user.click(screen.getByRole("button", { name: "Reveal Recovery Code" }));

    expect(await screen.findByText("DH-AAAA-BBBB")).toBeInTheDocument();
    expect(rotateRecoveryCodeMock).not.toHaveBeenCalled();
    expect(mockToastSuccess).not.toHaveBeenCalled();
  });

  it("generates a code via rotate when none exists, with a success toast", async () => {
    const user = userEvent.setup();
    getRecoveryCodeMock.mockResolvedValue(null);
    rotateRecoveryCodeMock.mockResolvedValue("DH-CCCC-DDDD");
    renderSettings();

    await user.click(screen.getByRole("button", { name: "Reveal Recovery Code" }));

    expect(await screen.findByText("DH-CCCC-DDDD")).toBeInTheDocument();
    expect(mockToastSuccess).toHaveBeenCalledWith("Recovery code generated.");
  });

  it("shows an error toast when reveal fails", async () => {
    const user = userEvent.setup();
    getRecoveryCodeMock.mockRejectedValue(new Error("network"));
    renderSettings();

    await user.click(screen.getByRole("button", { name: "Reveal Recovery Code" }));

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith("Failed to load recovery code.")
    );
  });

  it("hides the code again from Hide", async () => {
    const user = userEvent.setup();
    getRecoveryCodeMock.mockResolvedValue("DH-AAAA-BBBB");
    renderSettings();

    await user.click(screen.getByRole("button", { name: "Reveal Recovery Code" }));
    await screen.findByText("DH-AAAA-BBBB");
    await user.click(screen.getByRole("button", { name: "Hide" }));

    expect(screen.queryByText("DH-AAAA-BBBB")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reveal Recovery Code" })).toBeInTheDocument();
  });

  it("rotates the code on confirm, replacing the revealed value", async () => {
    const user = userEvent.setup();
    getRecoveryCodeMock.mockResolvedValue("DH-AAAA-BBBB");
    rotateRecoveryCodeMock.mockResolvedValue("DH-EEEE-FFFF");
    renderSettings();

    await user.click(screen.getByRole("button", { name: "Reveal Recovery Code" }));
    await screen.findByText("DH-AAAA-BBBB");
    await user.click(screen.getByRole("button", { name: "Rotate Code" }));
    await user.click(screen.getByRole("button", { name: "Yes, rotate" }));

    expect(rotateRecoveryCodeMock).toHaveBeenCalledWith("user-1");
    expect(await screen.findByText("DH-EEEE-FFFF")).toBeInTheDocument();
    expect(mockToastSuccess).toHaveBeenCalledWith(
      "Recovery code rotated. Write down your new code."
    );
  });

  it("shows an error toast when rotation fails", async () => {
    const user = userEvent.setup();
    getRecoveryCodeMock.mockResolvedValue("DH-AAAA-BBBB");
    rotateRecoveryCodeMock.mockRejectedValue(new Error("network"));
    renderSettings();

    await user.click(screen.getByRole("button", { name: "Reveal Recovery Code" }));
    await screen.findByText("DH-AAAA-BBBB");
    await user.click(screen.getByRole("button", { name: "Rotate Code" }));
    await user.click(screen.getByRole("button", { name: "Yes, rotate" }));

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        "Failed to rotate recovery code. Please try again."
      )
    );
  });

  it("revokes the identity recovery code after confirmation", async () => {
    const user = userEvent.setup();
    revokeIdentityRecoveryCodeMock.mockResolvedValue(undefined);
    renderSettings();

    await user.click(screen.getByRole("button", { name: "Revoke Code" }));
    await user.click(screen.getByRole("button", { name: "Yes, revoke" }));

    expect(revokeIdentityRecoveryCodeMock).toHaveBeenCalledOnce();
    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledWith("Recovery code revoked."));
  });

  it("reports a failed identity-code revocation", async () => {
    const user = userEvent.setup();
    revokeIdentityRecoveryCodeMock.mockRejectedValue(new Error("failed"));
    renderSettings();

    await user.click(screen.getByRole("button", { name: "Revoke Code" }));
    await user.click(screen.getByRole("button", { name: "Yes, revoke" }));

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        "Failed to revoke recovery code. Please try again."
      )
    );
  });
});

describe("Settings linked device", () => {
  it("disconnects this device through the shared account flow", async () => {
    const user = userEvent.setup();
    const { disconnect } = renderSettings();

    await user.click(screen.getByRole("button", { name: "Disconnect This Device" }));
    await user.click(screen.getByRole("button", { name: "Yes, disconnect" }));

    expect(disconnect).toHaveBeenCalledWith(false);
  });

  it("shows an error toast when disconnecting this device fails", async () => {
    const user = userEvent.setup();
    renderSettings({ disconnect: vi.fn().mockRejectedValue(new Error("network")) });

    await user.click(screen.getByRole("button", { name: "Disconnect This Device" }));
    await user.click(screen.getByRole("button", { name: "Yes, disconnect" }));

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith("Failed to disconnect device. Please try again.")
    );
  });

  it("warns before disconnecting the account's last device", async () => {
    const user = userEvent.setup();
    const { LastDeviceDisconnectError } = await import("../../src/services/deviceLinkService");
    const disconnect = vi
      .fn()
      .mockRejectedValueOnce(new LastDeviceDisconnectError())
      .mockResolvedValueOnce(undefined);
    renderSettings({ disconnect });

    await user.click(screen.getByRole("button", { name: "Disconnect This Device" }));
    await user.click(screen.getByRole("button", { name: "Yes, disconnect" }));

    expect(await screen.findByRole("heading", { name: "Disconnect Last Device" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Disconnect anyway" }));
    expect(disconnect).toHaveBeenNthCalledWith(1, false);
    expect(disconnect).toHaveBeenNthCalledWith(2, true);
  });
});

describe("Settings account deletion", () => {
  it("requires typing DELETE before deleting the primary account", async () => {
    const user = userEvent.setup();
    deleteCurrentAccountMock.mockResolvedValue(undefined);
    renderSettings();

    await user.click(screen.getByRole("button", { name: "Delete Account" }));
    const confirm = screen.getByRole("button", { name: "Delete permanently" });
    expect(confirm).toBeDisabled();
    await user.type(screen.getByPlaceholderText("DELETE"), "DELETE");
    await user.click(confirm);

    expect(deleteCurrentAccountMock).toHaveBeenCalledOnce();
  });

  it("offers account deletion on every connected device", () => {
    renderSettings();

    expect(screen.getByRole("button", { name: "Delete Account" })).toBeInTheDocument();
  });

  it("shows the server rejection when account deletion is blocked", async () => {
    const user = userEvent.setup();
    deleteCurrentAccountMock.mockRejectedValue(
      new Error("Delete or transfer every campaign you own before deleting your account.")
    );
    renderSettings();

    await user.click(screen.getByRole("button", { name: "Delete Account" }));
    await user.type(screen.getByPlaceholderText("DELETE"), "DELETE");
    await user.click(screen.getByRole("button", { name: "Delete permanently" }));

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        "Delete or transfer every campaign you own before deleting your account."
      )
    );
  });
});
