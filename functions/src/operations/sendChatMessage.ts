// functions/src/operations/sendChatMessage.ts
//
// Sends one message in a chat between a campaign's DM and the current owner of
// a character. The server decides who is DM and who is player from the stored
// campaign and character, writes both people's copies of the message and both
// chat entries in one transaction, and adds an unread to the receiver only.

import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { CHAT_LIMITS, assertCustomItemDocumentId, buildChatId } from "shared-rules";
import { runOperationTransaction, type IdempotencyExecution } from "../shared/idempotency.js";
import { resolvePrimaryUid } from "../shared/linkedIdentity.js";

export interface SendChatMessageInput {
  campaignId: string;
  characterId: string;
  text: string;
  operationId?: string;
}

export interface SendChatMessageResult {
  chatId: string;
  messageId: string;
}

function assertId(value: unknown, label: string): asserts value is string {
  try {
    assertCustomItemDocumentId(value, label);
  } catch {
    throw new HttpsError("invalid-argument", `${label} is invalid.`);
  }
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function sendChatMessage(
  input: SendChatMessageInput,
  callerUid: string,
  idempotency: IdempotencyExecution<SendChatMessageResult> | null = null
): Promise<SendChatMessageResult> {
  assertId(input.campaignId, "Campaign ID");
  assertId(input.characterId, "Character ID");
  const text = typeof input.text === "string" ? input.text.trim() : "";
  if (!text) throw new HttpsError("invalid-argument", "Message cannot be empty.");
  if (text.length > CHAT_LIMITS.messageCharacters) {
    throw new HttpsError(
      "invalid-argument",
      `Message cannot exceed ${CHAT_LIMITS.messageCharacters} characters.`
    );
  }

  const db = getFirestore();
  const callerAccountId = await resolvePrimaryUid(db, callerUid);
  const campaignRef = db.collection("campaigns").doc(input.campaignId);
  const characterRef = campaignRef.collection("characters").doc(input.characterId);

  return runOperationTransaction(db, idempotency, async (transaction) => {
    const [campaignSnapshot, characterSnapshot] = await Promise.all([
      transaction.get(campaignRef),
      transaction.get(characterRef),
    ]);
    if (!campaignSnapshot.exists) throw new HttpsError("not-found", "Campaign not found.");
    if (!characterSnapshot.exists) throw new HttpsError("not-found", "Character not found.");
    const campaign = campaignSnapshot.data() ?? {};
    const character = characterSnapshot.data() ?? {};

    const dmAccountId = nonEmptyString(campaign.dmId);
    const playerAccountId = nonEmptyString(character.userId);
    if (!dmAccountId) {
      throw new HttpsError("failed-precondition", "This campaign has no DM.");
    }

    const callerIsDm = callerAccountId === dmAccountId;
    const callerIsPlayer = playerAccountId !== null && callerAccountId === playerAccountId;
    if (callerIsDm && callerIsPlayer) {
      throw new HttpsError("failed-precondition", "You cannot message yourself.");
    }
    if (!callerIsDm && !callerIsPlayer) {
      throw new HttpsError("permission-denied", "You are not part of this conversation.");
    }
    if (!playerAccountId) {
      throw new HttpsError("failed-precondition", "No player has claimed this character.");
    }

    const [dmProfile, playerProfile] = await Promise.all([
      transaction.get(db.collection("userProfiles").doc(dmAccountId)),
      transaction.get(db.collection("userProfiles").doc(playerAccountId)),
    ]);
    const dmName =
      nonEmptyString(dmProfile.data()?.firstName) ?? nonEmptyString(campaign.gmName) ?? "DM";
    const header = (character.header ?? {}) as Record<string, unknown>;
    const playerName =
      nonEmptyString(playerProfile.data()?.firstName) ??
      nonEmptyString(header.playerName) ??
      "Player";

    const chatId = buildChatId(input.campaignId, input.characterId, playerAccountId);
    const dmChatRef = db.collection("users").doc(dmAccountId).collection("chats").doc(chatId);
    const playerChatRef = db
      .collection("users")
      .doc(playerAccountId)
      .collection("chats")
      .doc(chatId);
    const dmMessageRef = dmChatRef.collection("messages").doc();
    const playerMessageRef = playerChatRef.collection("messages").doc(dmMessageRef.id);

    const message = {
      fromAccountId: callerAccountId,
      text,
      timestamp: FieldValue.serverTimestamp(),
    };
    transaction.set(dmMessageRef, message);
    transaction.set(playerMessageRef, message);

    const shared = {
      campaignId: input.campaignId,
      characterId: input.characterId,
      playerAccountId,
      campaignName: nonEmptyString(campaign.name) ?? "Campaign",
      characterName: nonEmptyString(header.characterName) ?? "Character",
      lastMessage: text.slice(0, CHAT_LIMITS.previewCharacters),
      lastTimestamp: FieldValue.serverTimestamp(),
      closed: false,
    };
    transaction.set(
      dmChatRef,
      {
        ...shared,
        role: "dm",
        otherAccountId: playerAccountId,
        otherName: playerName,
        unreadCount: FieldValue.increment(callerIsDm ? 0 : 1),
      },
      { merge: true }
    );
    transaction.set(
      playerChatRef,
      {
        ...shared,
        role: "player",
        otherAccountId: dmAccountId,
        otherName: dmName,
        unreadCount: FieldValue.increment(callerIsDm ? 1 : 0),
      },
      { merge: true }
    );

    return { chatId, messageId: dmMessageRef.id };
  });
}
