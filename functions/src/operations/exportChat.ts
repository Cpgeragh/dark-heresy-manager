// functions/src/operations/exportChat.ts
//
// Builds the text export of one person's own copy of a chat. The copy lives under the caller's
// own account, so finding it there is the only authorisation needed. The receipt stores the
// fingerprint and the size, never the message text.

import { randomUUID } from "node:crypto";
import {
  FieldPath,
  FieldValue,
  getFirestore,
  type DocumentSnapshot,
  type Firestore,
  type Timestamp,
} from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { assertCustomItemDocumentId } from "shared-rules";
import {
  EXPORT_MAX_BYTES,
  assertValidTimeZone,
  buildChatExport,
  formatExportMessage,
  type ExportMessage,
} from "../shared/chatExport.js";
import { resolvePrimaryUid } from "../shared/linkedIdentity.js";

const PAGE_SIZE = 500;

export interface ExportChatInput {
  chatId: string;
  timeZone: string;
}

export interface ExportChatResult {
  exportId: string;
  fileName: string;
  text: string;
  fingerprint: string;
  messageCount: number;
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function readFirstName(db: Firestore, accountId: string): Promise<string> {
  const profile = await db.collection("userProfiles").doc(accountId).get();
  return nonEmptyString(profile.data()?.firstName) ?? "Me";
}

function fileNameFor(characterName: string, createdAt: Date): string {
  const slug = characterName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "chat"}-chat-${createdAt.toISOString().slice(0, 10)}.txt`;
}

export async function exportChat(
  input: ExportChatInput,
  callerUid: string
): Promise<ExportChatResult> {
  try {
    assertCustomItemDocumentId(input.chatId, "Chat ID");
  } catch {
    throw new HttpsError("invalid-argument", "Chat ID is invalid.");
  }
  assertValidTimeZone(input.timeZone);

  const db = getFirestore();
  const accountId = await resolvePrimaryUid(db, callerUid);
  const chatRef = db.collection("users").doc(accountId).collection("chats").doc(input.chatId);
  const chatSnapshot = await chatRef.get();
  if (!chatSnapshot.exists) throw new HttpsError("not-found", "Chat not found.");
  const chat = chatSnapshot.data() ?? {};

  const ownName = await readFirstName(db, accountId);
  const otherName = nonEmptyString(chat.otherName) ?? "Unknown";
  const ownIsDm = chat.role === "dm";
  const ownLabel = `${ownName} (${ownIsDm ? "DM" : "Player"})`;
  const otherLabel = `${otherName} (${ownIsDm ? "Player" : "DM"})`;
  const clearedAt = chat.clearedAt as Timestamp | undefined;

  const messages: ExportMessage[] = [];
  let bytes = 0;
  let lastDocument: DocumentSnapshot | undefined;
  for (;;) {
    let query = chatRef.collection("messages").orderBy("timestamp").orderBy(FieldPath.documentId());
    if (clearedAt) query = query.where("timestamp", ">", clearedAt);
    if (lastDocument) query = query.startAfter(lastDocument);
    const page = await query.limit(PAGE_SIZE).get();

    for (const document of page.docs) {
      const data = document.data();
      const sentAt = (data.timestamp as Timestamp | undefined)?.toDate();
      if (!sentAt) continue;
      const sender =
        data.fromAccountId === accountId
          ? ownLabel
          : data.fromAccountId === chat.otherAccountId
            ? otherLabel
            : "Unknown";
      const message: ExportMessage = {
        sender,
        sentAt,
        text: typeof data.text === "string" ? data.text : "",
      };
      bytes += Buffer.byteLength(formatExportMessage(message, input.timeZone), "utf8") + 1;
      if (bytes > EXPORT_MAX_BYTES) {
        throw new HttpsError("resource-exhausted", "This chat is too large to export in one file.");
      }
      messages.push(message);
    }

    if (page.size < PAGE_SIZE) break;
    lastDocument = page.docs[page.docs.length - 1];
  }

  const exportId = randomUUID();
  const createdAt = new Date();
  const characterName = nonEmptyString(chat.characterName) ?? "Character";
  const result = buildChatExport(
    {
      exportId,
      createdAt,
      timeZone: input.timeZone,
      characterName,
      campaignName: nonEmptyString(chat.campaignName) ?? "Campaign",
      participants: `${ownLabel} and ${otherLabel}`,
    },
    messages
  );

  await db
    .collection("users")
    .doc(accountId)
    .collection("exportReceipts")
    .doc(exportId)
    .set({
      exportId,
      chatId: input.chatId,
      fingerprint: result.fingerprint,
      messageCount: result.messageCount,
      byteLength: Buffer.byteLength(result.text, "utf8"),
      timeZone: input.timeZone,
      createdAt: FieldValue.serverTimestamp(),
    });

  return {
    exportId,
    fileName: fileNameFor(characterName, createdAt),
    text: result.text,
    fingerprint: result.fingerprint,
    messageCount: result.messageCount,
  };
}
