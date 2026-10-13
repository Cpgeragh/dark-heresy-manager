// tests/unit/chatPortraitService.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetDoc, mockSummaryRef } = vi.hoisted(() => ({
  mockGetDoc: vi.fn(),
  mockSummaryRef: vi.fn((campaignId: string, characterId: string) => ({
    path: `campaigns/${campaignId}/characterSummaries/${characterId}`,
  })),
}));

vi.mock("firebase/firestore", () => ({
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
}));

vi.mock("../../src/firebase/converters", () => ({
  characterSummaryDocRef: (campaignId: string, characterId: string) =>
    mockSummaryRef(campaignId, characterId),
}));

type Service = typeof import("../../src/services/chatPortraitService");
let service: Service;

beforeEach(async () => {
  vi.clearAllMocks();
  vi.resetModules();
  service = await import("../../src/services/chatPortraitService");
});

function snapshot(data: object | undefined) {
  return { data: () => data };
}

describe("chatPortraitService", () => {
  it("knows nothing about a portrait before it has loaded", () => {
    expect(service.getCachedChatPortrait("c1", "char-1")).toBeUndefined();
  });

  it("reads the portrait from the character summary and remembers it", async () => {
    mockGetDoc.mockResolvedValue(snapshot({ portraitUrl: "data:image/png;base64,AA" }));

    await expect(service.loadChatPortrait("c1", "char-1")).resolves.toBe(
      "data:image/png;base64,AA"
    );
    expect(mockSummaryRef).toHaveBeenCalledWith("c1", "char-1");
    expect(service.getCachedChatPortrait("c1", "char-1")).toBe("data:image/png;base64,AA");
  });

  it("does not read the same summary twice", async () => {
    mockGetDoc.mockResolvedValue(snapshot({ portraitUrl: "data:image/png;base64,AA" }));

    await service.loadChatPortrait("c1", "char-1");
    await service.loadChatPortrait("c1", "char-1");

    expect(mockGetDoc).toHaveBeenCalledTimes(1);
  });

  it("shares one read between callers that ask at the same time", async () => {
    mockGetDoc.mockResolvedValue(snapshot({ portraitUrl: "data:image/png;base64,AA" }));

    await Promise.all([
      service.loadChatPortrait("c1", "char-1"),
      service.loadChatPortrait("c1", "char-1"),
    ]);

    expect(mockGetDoc).toHaveBeenCalledTimes(1);
  });

  it("keeps different characters apart", async () => {
    mockGetDoc.mockResolvedValue(snapshot({ portraitUrl: "data:image/png;base64,AA" }));

    await service.loadChatPortrait("c1", "char-1");
    await service.loadChatPortrait("c1", "char-2");

    expect(mockGetDoc).toHaveBeenCalledTimes(2);
  });

  it("gives null when the summary has no portrait", async () => {
    mockGetDoc.mockResolvedValue(snapshot({ characterName: "Kael" }));

    await expect(service.loadChatPortrait("c1", "char-1")).resolves.toBeNull();
    expect(service.getCachedChatPortrait("c1", "char-1")).toBeNull();
  });

  it("gives null when the summary does not exist", async () => {
    mockGetDoc.mockResolvedValue(snapshot(undefined));

    await expect(service.loadChatPortrait("c1", "char-1")).resolves.toBeNull();
  });

  it("gives null and remembers it when the read fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockGetDoc.mockRejectedValue(new Error("offline"));

    await expect(service.loadChatPortrait("c1", "char-1")).resolves.toBeNull();
    expect(service.getCachedChatPortrait("c1", "char-1")).toBeNull();
  });
});
