// functions/src/shared/chatExport.ts
//
// Builds the text file a person downloads when they export their copy of a chat. The fingerprint
// is a SHA-256 of the message lines only, so the header can carry it without changing it.

import { createHash } from "node:crypto";
import { HttpsError } from "firebase-functions/v2/https";

export const EXPORT_MAX_BYTES = 2 * 1024 * 1024;

const SEPARATOR = "-".repeat(80);

export interface ExportMessage {
  sender: string;
  sentAt: Date;
  text: string;
}

export interface ExportHeader {
  exportId: string;
  createdAt: Date;
  timeZone: string;
  characterName: string;
  campaignName: string;
  participants: string;
}

export interface ChatExport {
  text: string;
  fingerprint: string;
  messageCount: number;
}

export function assertValidTimeZone(timeZone: unknown): asserts timeZone is string {
  if (typeof timeZone !== "string" || timeZone.length === 0 || timeZone.length > 64) {
    throw new HttpsError("invalid-argument", "Time zone is invalid.");
  }
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone });
  } catch {
    throw new HttpsError("invalid-argument", "Time zone is invalid.");
  }
}

function formatLocal(date: Date, timeZone: string): string {
  const day = date.toLocaleDateString("en-GB", {
    timeZone,
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const time = date.toLocaleTimeString("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return `${day}, ${time}`;
}

export function formatExportMessage(message: ExportMessage, timeZone: string): string {
  const text = message.text.replace(/\r?\n/g, "\n    ");
  return `[${formatLocal(message.sentAt, timeZone)}] ${message.sender}: ${text}`;
}

export function buildChatExport(header: ExportHeader, messages: ExportMessage[]): ChatExport {
  const body = messages
    .map((message) => `${formatExportMessage(message, header.timeZone)}\n`)
    .join("");
  if (Buffer.byteLength(body, "utf8") > EXPORT_MAX_BYTES) {
    throw new HttpsError("resource-exhausted", "This chat is too large to export in one file.");
  }

  const fingerprint = createHash("sha256").update(body, "utf8").digest("hex");
  const text = [
    "Dark Heresy Manager chat export",
    `Export ID: ${header.exportId}`,
    `Created: ${formatLocal(header.createdAt, header.timeZone)} (${header.timeZone})`,
    `Time zone: ${header.timeZone}`,
    `Character: ${header.characterName}`,
    `Campaign: ${header.campaignName}`,
    `Participants: ${header.participants}`,
    `Messages: ${messages.length}`,
    `Fingerprint (SHA-256 of the message lines below): ${fingerprint}`,
    SEPARATOR,
    "",
  ].join("\n");

  return { text: `${text}${body}`, fingerprint, messageCount: messages.length };
}
