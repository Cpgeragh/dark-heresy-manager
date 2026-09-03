// src/services/portraitService.ts

import {
  assertEncodedPortrait,
  assertFirestoreDocumentId,
  assertPortraitSource,
} from "../firestore/firebaseValidation";
import { runSingleFlight } from "../firestore/singleFlight";
import { patchCharacterField } from "./characterService";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Converts a cropped portrait blob to a base64 data URL and saves it,
 * along with the character's summary, to Firestore.
 *
 * @param campaignId - The campaign the character belongs to
 * @param characterId - The character to update
 * @param blob - The cropped image blob from react-easy-crop
 * @returns The base64 data URL of the portrait
 */
export async function uploadPortrait(
  campaignId: string,
  characterId: string,
  blob: Blob
): Promise<string> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertFirestoreDocumentId(characterId, "Character ID");
  assertPortraitSource(blob);
  return runSingleFlight("character:portrait", [campaignId, characterId], async () => {
    const base64 = await blobToBase64(blob);
    assertEncodedPortrait(base64);
    await patchCharacterField(campaignId, characterId, "portraitUrl", base64);
    return base64;
  });
}
