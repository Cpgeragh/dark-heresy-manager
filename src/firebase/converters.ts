// src/firebase/converters.ts
import {
  collection,
  doc,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
} from "firebase/firestore";

import { db } from "./index";
import type { Character } from "../types/Character";
import type { Campaign } from "../types/Campaign";
import type { User } from "../types/User";
import type { ClaimLog } from "../types/ClaimLog";

// ------------------------------
// CHARACTER CONVERTER
// ------------------------------
export const characterConverter: FirestoreDataConverter<Character> = {
  toFirestore(data) {
    return data;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions) {
    return { id: snapshot.id, ...snapshot.data(options) } as Character;
  },
};

export function characterDocRef(campaignId: string, characterId: string) {
  return doc(
    db,
    "campaigns",
    campaignId,
    "characters",
    characterId
  ).withConverter(characterConverter);
}

export function charactersCollectionRef(campaignId: string) {
  return collection(
    db,
    "campaigns",
    campaignId,
    "characters"
  ).withConverter(characterConverter);
}

// ------------------------------
// CAMPAIGN CONVERTER
// ------------------------------
export const campaignConverter: FirestoreDataConverter<Campaign> = {
  toFirestore(data) {
    return data;
  },
  fromFirestore(snapshot, options) {
    return { id: snapshot.id, ...snapshot.data(options) } as Campaign;
  },
};

export function campaignDocRef(campaignId: string) {
  return doc(db, "campaigns", campaignId).withConverter(campaignConverter);
}

export function campaignsCollectionRef() {
  return collection(db, "campaigns").withConverter(campaignConverter);
}

// ------------------------------
// USER CONVERTER
// ------------------------------
export const userConverter: FirestoreDataConverter<User> = {
  toFirestore(data) {
    return data;
  },
  fromFirestore(snapshot, options) {
    return { id: snapshot.id, ...snapshot.data(options) } as User;
  },
};

export function userDocRef(userId: string) {
  return doc(db, "users", userId).withConverter(userConverter);
}

// ------------------------------
// CLAIM LOG CONVERTER
// ------------------------------
export const claimLogConverter: FirestoreDataConverter<ClaimLog> = {
  toFirestore(data) {
    return data;
  },
  fromFirestore(snapshot, options) {
    return { id: snapshot.id, ...snapshot.data(options) } as ClaimLog;
  },
};

export function claimLogCollectionRef(
  campaignId: string,
  characterId: string
) {
  return collection(
    db,
    "campaigns",
    campaignId,
    "characters",
    characterId,
    "claimLog"
  ).withConverter(claimLogConverter);
}