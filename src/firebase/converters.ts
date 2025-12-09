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