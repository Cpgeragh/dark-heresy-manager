// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

const { callLink, callDisconnect, callList, callRename, callDisconnectOther } = vi.hoisted(() => ({
  callLink: vi.fn(),
  callDisconnect: vi.fn(),
  callList: vi.fn(),
  callRename: vi.fn(),
  callDisconnectOther: vi.fn(),
}));

vi.mock("firebase/functions", () => ({
  httpsCallable: vi.fn((_functions: unknown, name: string) => {
    if (name === "linkDevice") return callLink;
    if (name === "disconnectDevice") return callDisconnect;
    if (name === "listLinkedDevices") return callList;
    if (name === "renameLinkedDevice") return callRename;
    if (name === "disconnectOtherDevice") return callDisconnectOther;
    throw new Error(`Unexpected callable: ${name}`);
  }),
}));
vi.mock("../../src/firebase", () => ({ functions: "mock-functions" }));

import {
  disconnectDevice,
  disconnectOtherDevice,
  LastDeviceDisconnectError,
  listLinkedDevices,
  linkDeviceToAccount,
  renameLinkedDevice,
} from "../../src/services/deviceLinkService";

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  callLink.mockResolvedValue({ data: undefined });
  callDisconnect.mockResolvedValue({ data: { wasLastDevice: false } });
  callList.mockResolvedValue({ data: { devices: [] } });
  callRename.mockResolvedValue({ data: undefined });
  callDisconnectOther.mockResolvedValue({
    data: { recoveryCode: "DH-NEWW-CODE", remainingDeviceCount: 1 },
  });
});

describe("device link operations", () => {
  it("connects with a trimmed recovery code", async () => {
    await linkDeviceToAccount("device-1", "  DH-VALI-CODE  ", "  My phone  ");
    expect(callLink).toHaveBeenCalledWith({ code: "DH-VALI-CODE", deviceName: "My phone" });
  });

  it("rejects a malformed code before calling the server", async () => {
    await expect(linkDeviceToAccount("device-1", "bad", "My phone")).rejects.toThrow(
      "Invalid recovery code"
    );
    expect(callLink).not.toHaveBeenCalled();
  });

  it("asks the server to disconnect the current device", async () => {
    await expect(disconnectDevice("device-1")).resolves.toEqual({ wasLastDevice: false });
    expect(callDisconnect).toHaveBeenCalledWith({ confirmLastDevice: false });
  });

  it("allows an explicitly confirmed last-device disconnect", async () => {
    callDisconnect.mockResolvedValue({ data: { wasLastDevice: true } });
    await expect(disconnectDevice("device-1", true)).resolves.toEqual({ wasLastDevice: true });
    expect(callDisconnect).toHaveBeenCalledWith({ confirmLastDevice: true });
  });

  it("maps the server's last-device response to a specific client error", async () => {
    callDisconnect.mockRejectedValue({ details: { reason: "last-device" } });
    await expect(disconnectDevice("device-1")).rejects.toBeInstanceOf(LastDeviceDisconnectError);
  });

  it("lists every connected device", async () => {
    const devices = [{ uid: "device-1", name: "Phone", linkedAt: 123, isCurrentDevice: true }];
    callList.mockResolvedValue({ data: { devices } });
    await expect(listLinkedDevices()).resolves.toEqual(devices);
    expect(callList).toHaveBeenCalledWith({});
  });

  it("renames a connected device", async () => {
    await renameLinkedDevice("device-2", "  Old laptop  ");
    expect(callRename).toHaveBeenCalledWith({ targetDeviceUid: "device-2", name: "Old laptop" });
  });

  it("disconnects another device and returns the replacement recovery code", async () => {
    await expect(disconnectOtherDevice("device-2")).resolves.toEqual({
      recoveryCode: "DH-NEWW-CODE",
      remainingDeviceCount: 1,
    });
    expect(callDisconnectOther).toHaveBeenCalledWith({ targetDeviceUid: "device-2" });
  });
});
