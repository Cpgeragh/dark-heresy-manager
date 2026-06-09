// src/firebase/converters.ts

import {
  collection,
  doc,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
} from "firebase/firestore";

import { db } from "../firebase";
import type { Character } from "../types/Character";
import type { CampaignWithId, UserDocument } from "../types/Firestore";

/**
 * CHARACTER CONVERTER
 * - Strips `id`
 * - Leaves `campaignId` stored in Firestore (Option A)
 */
export const characterConverter: FirestoreDataConverter<Character> = {
  toFirestore(character: Character) {
    // Do not store `id` in document data
    const { id, ...rest } = character;
    return rest;
  },

  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions) {
    const data = snapshot.data(options);
    // Add `id` from the document id; `campaignId` comes from Firestore
    return {
      ...data,
      id: snapshot.id,
    } as Character;
  },
};

export function characterDocRef(campaignId: string, characterId: string) {
  return doc(db, "campaigns", campaignId, "characters", characterId).withConverter(
    characterConverter
  );
}

export function charactersCollectionRef(campaignId: string) {
  return collection(db, "campaigns", campaignId, "characters").withConverter(characterConverter);
}

/**
 * CAMPAIGN CONVERTER
 * - Strips `id` on write
 * - Injects `id` from document path on read
 */
export const campaignConverter: FirestoreDataConverter<CampaignWithId> = {
  toFirestore({ id: _id, ...rest }: CampaignWithId) {
    return rest;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions) {
    return { ...snapshot.data(options), id: snapshot.id } as CampaignWithId;
  },
};

export function campaignsCollectionRef() {
  return collection(db, "campaigns").withConverter(campaignConverter);
}

export function campaignDocRef(campaignId: string) {
  return doc(db, "campaigns", campaignId).withConverter(campaignConverter);
}

/**
 * USER CONVERTER
 * - No id field to strip/inject — ensures the document shape is typed
 */
export const userConverter: FirestoreDataConverter<UserDocument> = {
  toFirestore(user: UserDocument) {
    return user;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions) {
    return snapshot.data(options) as UserDocument;
  },
};

export function userDocRef(uid: string) {
  return doc(db, "users", uid).withConverter(userConverter);
}
