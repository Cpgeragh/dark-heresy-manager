// src/pages/characterSheet/types.ts

import type { CharField } from "../../utils/defaultCharacter";

export type Role = "player" | "dm";

export type CharacteristicsBlock = {
  ws: CharField;
  bs: CharField;
  s: CharField;
  t: CharField;
  ag: CharField;
  int: CharField;
  per: CharField;
  wp: CharField;
  fel: CharField;
};

export type Character = {
  id: string;
  name: string;
  userId: string | null;
  recoveryCode?: string;
  isEditableByPlayer?: boolean;
  notes?: string;
  characteristics?: CharacteristicsBlock;
  [key: string]: any;
};

export type ClaimLogEntry = {
  id: string;
  action: "claim" | "release" | "force-assign" | "force-release";
  actorUid: string;
  previousOwnerUid: string | null;
  newOwnerUid: string | null;
  timestamp?: any;
};

export type TabId =
  | "overview"
  | "stats"
  | "skills"
  | "talents"
  | "gear"
  | "xp"
  | "notes"
  | "admin";