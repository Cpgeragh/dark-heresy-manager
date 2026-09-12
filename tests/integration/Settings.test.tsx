// tests/integration/Settings.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const getRecoveryCodeMock = vi.fn();
const rotateRecoveryCodeMock = vi.fn();
vi.mock("../../src/services/identityService", () => ({
  getRecoveryCode: (...args: unknown[]) => getRecoveryCodeMock(...args),
  rotateRecoveryCode: (...args: unknown[]) => rotateRecoveryCodeMock(...args),
}));

const deleteCurrentAccountMock = vi.fn();
vi.mock("../../src/services/userAccountService", () => ({
  deleteCurrentAccount: (...args: unknown[]) => deleteCurrentAccountMock(...args),
}));
const listLinkedDevicesMock = vi.fn();
const renameLinkedDeviceMock = vi.fn();
const disconnectOtherDeviceMock = vi.fn();
vi.mock("../../src/services/deviceLinkService", () => ({
  LastDeviceDisconnectError: class LastDeviceDisconnectError extends Error {},
  listLinkedDevices: (...args: unknown[]) => listLinkedDevicesMock(...args),
  renameLinkedDevice: (...args: unknown[]) => renameLinkedDeviceMock(...args),
  disconnectOtherDevice: (...args: unknown[]) => disconnectOtherDeviceMock(...args),
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
  listLinkedDevicesMock.mockResolvedValue([
    { uid: "device-1", name: "Phone", linkedAt: 1_700_000_000_000, isCurrentDevice: true },
    { uid: "device-2", name: "Old laptop", linkedAt: 1_600_000_000_000, isCurrentDevice: false },
  ]);
  renameLinkedDeviceMock.mockResolvedValue(undefined);
  disconnectOtherDeviceMock.mockResolvedValue({
    recoveryCode: "DH-NEWW-CODE",
    remainingDeviceCount: 1,
  });
});

function renderSettings(props: Partial<React.ComponentProps<typeof Settings>> = {}) {
  const disconnect = vi.fn().mockResolvedValue(undefined);
  const onClose = vi.fn();
  render(
    <Settings
      effectiveUserId="user-1"
      firstName="Alice"
      disconnect={disconnect}
      onClose={onClose}
      {...props}
    />
  );
  return { disconnect, onClose };
}

describe("Settings modal", () => {
  it("uses the standard modal shell and closes from its header", async () => {
    const user = userEvent.setup();
    const { onClose } = renderSettings();

    const dialog = screen.getByRole("dialog", { name: "Settings" });
    await user.click(within(dialog).getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe("Settings display name", () => {
  it("pre-fills the input with the current first name", async () => {
    const user = userEvent.setup();
    renderSettings();
    await user.click(screen.getByRole("button", { name: "Edit display name" }));
    expect(screen.getByPlaceholderText("e.g. David")).toHaveValue("Alice");
  });

  it("disables Save until the draft actually changes", async () => {
    const user = userEvent.setup();
    renderSettings();
    await user.click(screen.getByRole("button", { name: "Edit display name" }));
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("saves a changed name and shows a success toast", async () => {
    const user = userEvent.setup();
    saveFirstNameMock.mockResolvedValue(undefined);
    renderSettings();
    await user.click(screen.getByRole("button", { name: "Edit display name" }));

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
    await user.click(screen.getByRole("button", { name: "Edit display name" }));

    const input = screen.getByPlaceholderText("e.g. David");
    await user.clear(input);
    await user.type(input, "Cain Marko");

    expect(input).toHaveValue("CainMarko");
  });

  it("capitalizes the first letter as it is typed", async () => {
    const user = userEvent.setup();
    renderSettings();
    await user.click(screen.getByRole("button", { name: "Edit display name" }));

    const input = screen.getByPlaceholderText("e.g. David");
    await user.clear(input);
    await user.type(input, "cormac");

    expect(input).toHaveValue("Cormac");
  });

  it("shows an error when saving fails", async () => {
    const user = userEvent.setup();
    saveFirstNameMock.mockRejectedValue(new Error("network"));
    renderSettings();
    await user.click(screen.getByRole("button", { name: "Edit display name" }));

    const input = screen.getByPlaceholderText("e.g. David");
    await user.clear(input);
    await user.type(input, "Cain");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith("Failed to save display name. Please try again.")
    );
  });
});

describe("Settings recovery code", () => {
  it("reveals an existing code without generating a new one", async () => {
    const user = userEvent.setup();
    getRecoveryCodeMock.mockResolvedValue("DH-AAAA-BBBB");
    renderSettings();

    await user.click(screen.getByRole("button", { name: "Reveal recovery code" }));

    expect(await screen.findByText("DH-AAAA-BBBB")).toBeInTheDocument();
    expect(rotateRecoveryCodeMock).not.toHaveBeenCalled();
    expect(mockToastSuccess).not.toHaveBeenCalled();
  });

  it("generates a code via rotate when none exists, with a success toast", async () => {
    const user = userEvent.setup();
    getRecoveryCodeMock.mockResolvedValue(null);
    rotateRecoveryCodeMock.mockResolvedValue("DH-CCCC-DDDD");
    renderSettings();

    await user.click(screen.getByRole("button", { name: "Reveal recovery code" }));

    expect(await screen.findByText("DH-CCCC-DDDD")).toBeInTheDocument();
    expect(mockToastSuccess).toHaveBeenCalledWith("Recovery code generated.");
  });

  it("shows an error toast when reveal fails", async () => {
    const user = userEvent.setup();
    getRecoveryCodeMock.mockRejectedValue(new Error("network"));
    renderSettings();

    await user.click(screen.getByRole("button", { name: "Reveal recovery code" }));

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith("Failed to load recovery code.")
    );
  });

  it("hides the code again when the modal is closed", async () => {
    const user = userEvent.setup();
    getRecoveryCodeMock.mockResolvedValue("DH-AAAA-BBBB");
    renderSettings();

    await user.click(screen.getByRole("button", { name: "Reveal recovery code" }));
    await screen.findByText("DH-AAAA-BBBB");
    const revealDialog = screen.getByRole("dialog", { name: "Reveal Code" });
    await user.click(within(revealDialog).getByRole("button", { name: "Close" }));

    expect(screen.queryByText("DH-AAAA-BBBB")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reveal recovery code" })).toBeInTheDocument();
  });

  it("rotates the code on confirm, replacing the revealed value", async () => {
    const user = userEvent.setup();
    getRecoveryCodeMock.mockResolvedValue("DH-AAAA-BBBB");
    rotateRecoveryCodeMock.mockResolvedValue("DH-EEEE-FFFF");
    renderSettings();

    await user.click(screen.getByRole("button", { name: "Reveal recovery code" }));
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

    await user.click(screen.getByRole("button", { name: "Reveal recovery code" }));
    await screen.findByText("DH-AAAA-BBBB");
    await user.click(screen.getByRole("button", { name: "Rotate Code" }));
    await user.click(screen.getByRole("button", { name: "Yes, rotate" }));

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        "Failed to rotate recovery code. Please try again."
      )
    );
  });
});

describe("Settings linked device", () => {
  it("does not load devices just because Settings opened", () => {
    renderSettings();
    expect(listLinkedDevicesMock).not.toHaveBeenCalled();
  });

  it("loads and shows the exact device list only after Manage Devices is opened", async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.click(screen.getByRole("button", { name: "Manage devices" }));

    expect(await screen.findByRole("dialog", { name: "Manage Devices" })).toBeVisible();
    expect(screen.getByText("Phone")).toBeVisible();
    expect(screen.getByText("Old laptop")).toBeVisible();
    expect(screen.getByText("Current device")).toBeVisible();
    for (const linkedDate of screen.getAllByText(/^Linked /)) {
      expect(linkedDate).toHaveClass("text-slate-400");
    }
    expect(listLinkedDevicesMock).toHaveBeenCalledOnce();
  });

  it("does not show a device error until the user requests the list", async () => {
    const user = userEvent.setup();
    listLinkedDevicesMock.mockRejectedValue(new Error("network"));
    renderSettings();

    expect(mockToastError).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Manage devices" }));

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        "Failed to load connected devices. Please try again."
      )
    );
  });

  it("renames any device on the account", async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.click(screen.getByRole("button", { name: "Manage devices" }));
    await user.click(await screen.findByRole("button", { name: "Rename Old laptop" }));
    const input = screen.getByPlaceholderText("e.g. Cormac's phone");
    await user.clear(input);
    await user.type(input, "Home laptop");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(renameLinkedDeviceMock).toHaveBeenCalledWith("device-2", "Home laptop");
    expect(await screen.findByText("Home laptop")).toBeVisible();
  });

  it("unlinks another device and leaves the rotated code available from Settings", async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.click(screen.getByRole("button", { name: "Manage devices" }));
    await user.click(await screen.findByRole("button", { name: "Unlink Old laptop" }));
    await user.click(screen.getByRole("button", { name: "Yes, unlink" }));

    expect(disconnectOtherDeviceMock).toHaveBeenCalledWith("device-2");
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Manage Devices" })).not.toBeInTheDocument()
    );
    expect(
      screen.queryByRole("dialog", { name: "Save New Recovery Code" })
    ).not.toBeInTheDocument();
    expect(mockToastSuccess).toHaveBeenCalledWith("Device unlinked and recovery code rotated.");

    getRecoveryCodeMock.mockResolvedValue("DH-NEWW-CODE");
    await user.click(screen.getByRole("button", { name: "Reveal recovery code" }));
    expect(await screen.findByText("DH-NEWW-CODE")).toBeVisible();
  });

  it("disconnects this device through the shared account flow", async () => {
    const user = userEvent.setup();
    const { disconnect } = renderSettings();

    await user.click(screen.getByRole("button", { name: "Manage devices" }));
    await user.click(await screen.findByRole("button", { name: "Unlink Phone" }));
    await user.click(screen.getByRole("button", { name: "Yes, unlink" }));

    expect(disconnect).toHaveBeenCalledWith(false);
  });

  it("warns before unlinking the account's last device", async () => {
    const user = userEvent.setup();
    listLinkedDevicesMock.mockResolvedValue([
      { uid: "device-1", name: "Phone", linkedAt: null, isCurrentDevice: true },
    ]);
    const { disconnect } = renderSettings();

    await user.click(screen.getByRole("button", { name: "Manage devices" }));
    await user.click(await screen.findByRole("button", { name: "Unlink Phone" }));

    expect(await screen.findByRole("heading", { name: "Unlink Last Device" })).toBeVisible();
    const unlinkAnyway = screen.getByRole("button", { name: "Unlink anyway" });
    expect(unlinkAnyway).toHaveClass("border-red-500", "text-red-500");
    expect(unlinkAnyway).not.toHaveClass("bg-red-700");
    await user.click(unlinkAnyway);
    expect(disconnect).toHaveBeenCalledWith(true);
  });
});

describe("Settings account deletion", () => {
  it("requires typing DELETE before deleting the account", async () => {
    const user = userEvent.setup();
    deleteCurrentAccountMock.mockResolvedValue(undefined);
    renderSettings();

    await user.click(screen.getByRole("button", { name: "Delete account" }));
    const confirm = screen.getByRole("button", { name: "Delete permanently" });
    expect(confirm).toBeDisabled();
    await user.type(screen.getByPlaceholderText("DELETE"), "DELETE");
    await user.click(confirm);

    expect(deleteCurrentAccountMock).toHaveBeenCalledOnce();
  });

  it("offers account deletion on every connected device", () => {
    renderSettings();

    expect(screen.getByRole("button", { name: "Delete account" })).toBeInTheDocument();
  });

  it("shows the server rejection when account deletion is blocked", async () => {
    const user = userEvent.setup();
    deleteCurrentAccountMock.mockRejectedValue(
      new Error("Delete or transfer every campaign you own before deleting your account.")
    );
    renderSettings();

    await user.click(screen.getByRole("button", { name: "Delete account" }));
    await user.type(screen.getByPlaceholderText("DELETE"), "DELETE");
    await user.click(screen.getByRole("button", { name: "Delete permanently" }));

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        "Delete or transfer every campaign you own before deleting your account."
      )
    );
  });
});
