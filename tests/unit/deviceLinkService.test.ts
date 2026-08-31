// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockDeleteDoc, mockDoc, mockCallLinkDevice } = vi.hoisted(() => ({
  mockDeleteDoc: vi.fn(),
  mockDoc: vi.fn((...args: unknown[]) => args.slice(1).join("/")),
  mockCallLinkDevice: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
}));

vi.mock("firebase/functions", () => ({
  httpsCallable: vi.fn((_functions: unknown, name: string) => {
    if (name === "linkDevice") return mockCallLinkDevice;
    throw new Error(`Unexpected callable: ${name}`);
  }),
}));

vi.mock("../../src/firebase", () => ({
  db: "mock-db",
  functions: "mock-functions",
}));

import { linkDeviceToAccount, unlinkDevice } from "../../src/services/deviceLinkService";

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mockDeleteDoc.mockResolvedValue(undefined);
  mockCallLinkDevice.mockResolvedValue({ data: undefined });
});

describe("device link operations", () => {
  it("reuses one in-flight call for a duplicate device-link attempt", async () => {
    let finish!: (value: unknown) => void;
    const pending = new Promise((resolve) => {
      finish = resolve;
    });
    mockCallLinkDevice.mockReturnValueOnce(pending);

    const first = linkDeviceToAccount("duplicate-device", "DH-VALI-CODE");
    const duplicate = linkDeviceToAccount("duplicate-device", "DH-VALI-CODE");
    await Promise.resolve();

    expect(mockCallLinkDevice).toHaveBeenCalledOnce();
    finish({ data: undefined });
    await Promise.all([first, duplicate]);
  });

  it("rejects a malformed recovery code before calling the Function", async () => {
    await expect(linkDeviceToAccount("device-uid", "not-a-code")).rejects.toThrow("DH-XXXX-YYYY");
    expect(mockCallLinkDevice).not.toHaveBeenCalled();
  });

  it("calls linkDevice with the trimmed code", async () => {
    await linkDeviceToAccount("device-uid", "  DH-VALI-CODE  ");

    expect(mockCallLinkDevice).toHaveBeenCalledWith({ code: "DH-VALI-CODE" });
  });

  it("propagates a rejection from the Function", async () => {
    const error = new Error("Recovery code not found.");
    mockCallLinkDevice.mockRejectedValue(error);

    await expect(linkDeviceToAccount("device-uid", "DH-UNKN-OWN0")).rejects.toBe(error);
  });

  it("blocks the sixth valid device-link attempt before calling Firebase", async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await linkDeviceToAccount("device-uid", `DH-LINK-000${attempt}`);
    }

    await expect(linkDeviceToAccount("device-uid", "DH-LINK-0005")).rejects.toThrow(
      "Too many device-link code attempts. Try again in 15 minutes."
    );
    expect(mockCallLinkDevice).toHaveBeenCalledTimes(5);
  });

  it("unlinks the current device", async () => {
    await unlinkDevice("device-uid");

    expect(mockDeleteDoc).toHaveBeenCalledWith("userLinks/device-uid");
  });

  it("collapses a duplicate in-flight unlink", async () => {
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => {
      finish = resolve;
    });
    mockDeleteDoc.mockReturnValueOnce(pending);

    const first = unlinkDevice("device-uid");
    const duplicate = unlinkDevice("device-uid");

    await vi.waitFor(() => expect(mockDeleteDoc).toHaveBeenCalledOnce());
    finish();
    await Promise.all([first, duplicate]);
    expect(mockDeleteDoc).toHaveBeenCalledOnce();
  });
});
