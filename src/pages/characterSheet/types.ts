// src/pages/characterSheet/types.ts

/** DM vs Player — UI logic only */
export type Role = "player" | "dm";

/** UI-only claim log type */
export type ClaimLogEntry = {
  id: string;
  action: "claim" | "release" | "force-assign" | "force-release";
  actorUid: string;
  previousOwnerUid: string | null;
  newOwnerUid: string | null;
  timestamp?: any;
};

/** Tab identifiers for CharacterSheet */
export type TabId =
  | "overview"
  | "stats"
  | "skills"
  | "talents"
  | "gear"
  | "xp"
  | "notes"
  | "admin";