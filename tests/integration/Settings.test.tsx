// tests/integration/Settings.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { User } from "firebase/auth";
import "@testing-library/jest-dom";

const getRecoveryCodeMock = vi.fn();
const rotateRecoveryCodeMock = vi.fn();
vi.mock("../../src/services/identityService", () => ({
  getRecoveryCode: (...args: unknown[]) => getRecoveryCodeMock(...args),
  rotateRecoveryCode: (...args: unknown[]) => rotateRecoveryCodeMock(...args),
}));

const saveFirstNameMock = vi.fn();
vi.mock("../../src/services/profileService", () => ({
  saveFirstName: (...args: unknown[]) => saveFirstNameMock(...args),
}));

const linkDeviceMock = vi.fn();
const useLinkDeviceMock = vi.fn();
vi.mock("../../src/hooks/useLinkDevice", () => ({
  useLinkDevice: () => useLinkDeviceMock(),
}));

const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();
vi.mock("../../src/components/Toast", () => ({
  useToast: () => ({ error: mockToastError, success: mockToastSuccess }),
}));

import Settings from "../../src/pages/Settings";

const user1 = { uid: "user-1" } as User;

beforeEach(() => {
  vi.clearAllMocks();
  useLinkDeviceMock.mockReturnValue({ linkDevice: linkDeviceMock, loading: false, error: null });
});

function renderSettings(props: Partial<React.ComponentProps<typeof Settings>> = {}) {
  const unlink = vi.fn().mockResolvedValue(undefined);
  render(
    <Settings
      user={user1}
      effectiveUserId="user-1"
      firstName="Alice"
      isLinked={false}
      unlink={unlink}
      {...props}
    />
  );
  return { unlink };
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
    expect(mockToastSuccess).toHaveBeenCalledWith("Recovery code rotated. Write down your new code.");
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
      expect(mockToastError).toHaveBeenCalledWith("Failed to rotate recovery code. Please try again.")
    );
  });
});

describe("Settings linked device", () => {
  it("links a device with the typed code and clears the input", async () => {
    const user = userEvent.setup();
    linkDeviceMock.mockResolvedValue(undefined);
    renderSettings();

    const input = screen.getByPlaceholderText("Paste recovery code here");
    await user.type(input, "DH-AAAA-BBBB");
    await user.click(screen.getByRole("button", { name: "Link This Device" }));

    expect(linkDeviceMock).toHaveBeenCalledWith("DH-AAAA-BBBB");
    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledWith("Device linked successfully."));
  });

  it("disables Link This Device until a code is typed", () => {
    renderSettings();
    expect(screen.getByRole("button", { name: "Link This Device" })).toBeDisabled();
  });

  it("shows the link error surfaced by useLinkDevice", () => {
    useLinkDeviceMock.mockReturnValue({
      linkDevice: linkDeviceMock,
      loading: false,
      error: "Invalid or already-used code.",
    });
    renderSettings();

    expect(screen.getByText("Invalid or already-used code.")).toBeInTheDocument();
  });

  it("shows the Unlink flow when this device is linked, and confirms", async () => {
    const user = userEvent.setup();
    const { unlink } = renderSettings({ isLinked: true });

    expect(screen.queryByRole("button", { name: "Link This Device" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Unlink This Device" }));
    await user.click(screen.getByRole("button", { name: "Yes, unlink" }));

    expect(unlink).toHaveBeenCalled();
    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledWith("Device unlinked."));
  });

  it("shows an error toast when unlinking fails", async () => {
    const user = userEvent.setup();
    renderSettings({ isLinked: true, unlink: vi.fn().mockRejectedValue(new Error("x")) });

    await user.click(screen.getByRole("button", { name: "Unlink This Device" }));
    await user.click(screen.getByRole("button", { name: "Yes, unlink" }));

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith("Failed to unlink device. Please try again.")
    );
  });
});
