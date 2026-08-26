// src/types/Firestore.ts

import type { Timestamp, FieldValue } from "firebase/firestore";
import type { Character } from "./Character";
import type { ClaimLog } from "./ClaimLog";

/**
 * Campaign document stored in /campaigns/{campaignId}
 */
export interface CampaignDocument {
  name: string;
  dmId: string;
  memberIds: string[];
  createdAt: Timestamp | Date | FieldValue;
  archivedAt: Timestamp | Date | null;
}

/**
 * Campaign document with its Firestore document id injected.
 * Used as the converter type for campaignsCollectionRef.
 */
export type CampaignWithId = CampaignDocument & { id: string };

/**
 * User document stored in /users/{userId}
 */
export interface UserDocument {
  role?: "player" | "dm";
  activeCampaignId?: string | null;
  createdAt: Timestamp | Date | FieldValue;
  onboarded?: boolean;
  recoveryBackedUp?: boolean;
}

/**
 * Public profile document stored in /userProfiles/{userId}
 * First name only (data protection). Readable by any authenticated user so
 * DMs and party members can display the owner's name on character sheets.
 */
export interface UserProfileDocument {
  firstName: string;
}

/**
 * Recovery index document stored in /recoveryIndex/{code}
 */
export interface RecoveryIndexDocument {
  campaignId: string;
  characterId: string;
}

/**
 * Character document stored in /campaigns/{campaignId}/characters/{characterId}
 * (Already defined in Character.ts, re-export for consistency)
 */
export type CharacterDocument = Character;

/**
 * Claim log document stored in /campaigns/{campaignId}/characters/{characterId}/claimLog/{logId}
 * (Already defined in ClaimLog.ts, re-export for consistency)
 */
export type ClaimLogDocument = ClaimLog;

/**
 * Helper type for character list items (partial data for lists)
 */
export interface CharacterListItem {
  id: string;
  campaignId: string;
  userId: string | null;
  isEditableByPlayer: boolean;
  recoveryCode: string;
  header?: {
    characterName?: string;
    career?: string;
    rank?: string;
  };
  wounds?: {
    current: number;
    total: number;
  };
  experience?: {
    total: number;
    spent: number;
  };
  portraitUrl?: string;
}

/**
 * Character summary document stored in
 * /campaigns/{campaignId}/characterSummaries/{characterId}
 * A restricted, campaign-member-readable view of a character — name,
 * player name, career, rank, and portrait only. Never the Recovery Code
 * or any other sheet data. Kept in sync with the real character document
 * by characterService.ts's write functions.
 */
export interface CharacterSummaryDocument {
  campaignId: string;
  characterName: string;
  playerName?: string;
  career?: string;
  rank?: string;
  portraitUrl?: string;
}

/**
 * Character summary document with its Firestore document id injected.
 * Used as the converter type for characterSummariesCollectionRef.
 */
export type CharacterSummaryWithId = CharacterSummaryDocument & { id: string };

/**
 * Session document stored in /campaigns/{campaignId}/sessions/{sessionId}
 */
export interface SessionDocument {
  date: Timestamp | Date | FieldValue;
  summary: string;
  dmNotes: string;
  xpAwarded: number;
  attendees: string[];
  createdAt: Timestamp | Date | FieldValue;
  xpApplied?: boolean;
}

/**
 * A single message in a player-DM thread.
 * Stored in /campaigns/{campaignId}/threads/{playerUid}/messages/{messageId}
 */
export interface ThreadMessage {
  id: string;
  fromUid: string;
  text: string;
  timestamp: Timestamp | null; // null briefly before serverTimestamp resolves
  read: boolean;
}

/**
 * Thread summary doc — one per player per campaign.
 * Stored in /campaigns/{campaignId}/threads/{playerUid}
 */
export interface ThreadSummary {
  characterId: string;
  lastMessage: string | null;
  lastTimestamp: Timestamp | null;
  unreadForDM: number;
}
