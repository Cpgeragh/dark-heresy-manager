// src/services/portraitService.ts

import { updateDoc } from "firebase/firestore";
import { characterDocRef } from "../firebase/converters";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Converts a cropped portrait blob to a base64 data URL and saves it
 * directly to the character document in Firestore.
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
  const base64 = await blobToBase64(blob);

  const characterRef = characterDocRef(campaignId, characterId);
  await updateDoc(characterRef, { portraitUrl: base64 });

  return base64;
}
