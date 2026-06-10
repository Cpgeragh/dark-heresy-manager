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
  lastSeen: Timestamp | Date | FieldValue;
  onboarded?: boolean;
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
 * XP proposal document stored in
 * /campaigns/{campaignId}/characters/{characterId}/xpProposals/{proposalId}
 */
export interface XpProposalDocument {
  playerId: string;
  description: string;
  xpCost: number;
  status: "pending" | "approved" | "rejected";
  proposedAt: Timestamp | Date | FieldValue;
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
