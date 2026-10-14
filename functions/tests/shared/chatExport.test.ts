// functions/tests/shared/chatExport.test.ts
import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import {
  EXPORT_MAX_BYTES,
  assertValidTimeZone,
  buildChatExport,
  formatExportMessage,
  type ExportHeader,
  type ExportMessage,
} from "../../src/shared/chatExport";

const header: ExportHeader = {
  exportId: "export-1",
  createdAt: new Date("2026-10-14T19:50:00Z"),
  timeZone: "Europe/London",
  characterName: "Brother Kael",
  campaignName: "Calixis",
  participants: "Marcus (DM) and Anna (Player)",
};

function message(over: Partial<ExportMessage> = {}): ExportMessage {
  return {
    sender: "Marcus (DM)",
    sentAt: new Date("2026-10-14T22:30:00Z"),
    text: "Hello there",
    ...over,
  };
}

const sha256 = (value: string) => createHash("sha256").update(value, "utf8").digest("hex");

describe("assertValidTimeZone", () => {
  it("accepts real time zones", () => {
    expect(() => assertValidTimeZone("Europe/London")).not.toThrow();
    expect(() => assertValidTimeZone("UTC")).not.toThrow();
    expect(() => assertValidTimeZone("America/New_York")).not.toThrow();
  });

  it("rejects a made-up, empty, over-long or non-text time zone", () => {
    for (const value of ["Not/AZone", "", "x".repeat(65), 5, null, undefined]) {
      expect(() => assertValidTimeZone(value)).toThrow(
        expect.objectContaining({ code: "invalid-argument" })
      );
    }
  });
});

describe("formatExportMessage", () => {
  it("writes the date and time in the given time zone", () => {
    expect(formatExportMessage(message(), "UTC")).toBe(
      "[14 October 2026, 22:30] Marcus (DM): Hello there"
    );
    expect(formatExportMessage(message(), "Europe/London")).toBe(
      "[14 October 2026, 23:30] Marcus (DM): Hello there"
    );
    expect(formatExportMessage(message(), "America/New_York")).toBe(
      "[14 October 2026, 18:30] Marcus (DM): Hello there"
    );
  });

  it("moves to the next day when the time zone is ahead", () => {
    expect(
      formatExportMessage(message({ sentAt: new Date("2026-10-14T23:30:00Z") }), "Europe/London")
    ).toBe("[15 October 2026, 00:30] Marcus (DM): Hello there");
  });

  it("indents the extra lines of a long message", () => {
    expect(formatExportMessage(message({ text: "One\nTwo\r\nThree" }), "UTC")).toBe(
      "[14 October 2026, 22:30] Marcus (DM): One\n    Two\n    Three"
    );
  });
});

describe("buildChatExport", () => {
  it("writes a header with the export details and the message lines below it", () => {
    const result = buildChatExport(header, [
      message(),
      message({ sender: "Anna (Player)", text: "Hi" }),
    ]);

    expect(result.messageCount).toBe(2);
    expect(result.text).toContain("Dark Heresy Manager chat export");
    expect(result.text).toContain("Export ID: export-1");
    expect(result.text).toContain("Created: 14 October 2026, 20:50 (Europe/London)");
    expect(result.text).toContain("Time zone: Europe/London");
    expect(result.text).toContain("Character: Brother Kael");
    expect(result.text).toContain("Campaign: Calixis");
    expect(result.text).toContain("Participants: Marcus (DM) and Anna (Player)");
    expect(result.text).toContain("Messages: 2");
    expect(result.text).toContain("[14 October 2026, 23:30] Marcus (DM): Hello there\n");
    expect(result.text).toContain("[14 October 2026, 23:30] Anna (Player): Hi\n");
  });

  it("states a fingerprint that is the SHA-256 of the message lines", () => {
    const messages = [message(), message({ text: "Second" })];
    const result = buildChatExport(header, messages);
    const body = messages
      .map((entry) => `${formatExportMessage(entry, header.timeZone)}\n`)
      .join("");

    expect(result.fingerprint).toBe(sha256(body));
    expect(result.text).toContain(
      `Fingerprint (SHA-256 of the message lines below): ${sha256(body)}`
    );
    expect(result.text.endsWith(body)).toBe(true);
  });

  it("changes the fingerprint when a message changes, and keeps it when only the header changes", () => {
    const original = buildChatExport(header, [message()]);
    const edited = buildChatExport(header, [message({ text: "Hello there!" })]);
    const otherHeader = buildChatExport({ ...header, exportId: "export-2" }, [message()]);

    expect(edited.fingerprint).not.toBe(original.fingerprint);
    expect(otherHeader.fingerprint).toBe(original.fingerprint);
  });

  it("exports an empty chat with the fingerprint of nothing", () => {
    const result = buildChatExport(header, []);

    expect(result.messageCount).toBe(0);
    expect(result.fingerprint).toBe(sha256(""));
  });

  it("refuses a chat that is too large to export", () => {
    const big = Array.from({ length: 1100 }, () => message({ text: "a".repeat(2000) }));

    expect(() => buildChatExport(header, big)).toThrow(
      expect.objectContaining({ code: "resource-exhausted" })
    );
    expect(EXPORT_MAX_BYTES).toBe(2 * 1024 * 1024);
  });
});
