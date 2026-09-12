// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

const { callLink, callDisconnect } = vi.hoisted(() => ({
  callLink: vi.fn(),
  callDisconnect: vi.fn(),
}));

vi.mock("firebase/functions", () => ({
  httpsCallable: vi.fn((_functions: unknown, name: string) => {
    if (name === "linkDevice") return callLink;
    if (name === "disconnectDevice") return callDisconnect;
    throw new Error(`Unexpected callable: ${name}`);
  }),
}));
vi.mock("../../src/firebase", () => ({ functions: "mock-functions" }));

import {
  disconnectDevice,
  LastDeviceDisconnectError,
  linkDeviceToAccount,
} from "../../src/services/deviceLinkService";

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  callLink.mockResolvedValue({ data: undefined });
  callDisconnect.mockResolvedValue({ data: { wasLastDevice: false } });
});

describe("device link operations", () => {
  it("connects with a trimmed recovery code", async () => {
    await linkDeviceToAccount("device-1", "  DH-VALI-CODE  ");
    expect(callLink).toHaveBeenCalledWith({ code: "DH-VALI-CODE" });
  });

  it("rejects a malformed code before calling the server", async () => {
    await expect(linkDeviceToAccount("device-1", "bad")).rejects.toThrow("Invalid recovery code");
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
});
