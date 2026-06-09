// src/services/portraitService.ts

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { storage, db } from "../firebase";

/**
 * Uploads a cropped portrait image to Firebase Storage and updates the
 * character document with the resulting download URL.
 *
 * @param campaignId - The campaign the character belongs to
 * @param characterId - The character to update
 * @param blob - The cropped image blob from react-easy-crop
 * @returns The public download URL of the uploaded portrait
 */
export async function uploadPortrait(
  campaignId: string,
  characterId: string,
  blob: Blob
): Promise<string> {
  const storageRef = ref(storage, `portraits/${campaignId}/${characterId}`);
  await uploadBytes(storageRef, blob);
  const url = await getDownloadURL(storageRef);

  const characterRef = doc(db, "campaigns", campaignId, "characters", characterId);
  await updateDoc(characterRef, { portraitUrl: url });

  return url;
}
