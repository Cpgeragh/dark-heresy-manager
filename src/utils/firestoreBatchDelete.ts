import { writeBatch, type DocumentReference, type Firestore } from "firebase/firestore";

const BATCH_DELETE_LIMIT = 450;

/**
 * Deletes every given document reference, committing in chunks safely under
 * Firestore's 500-operation batch limit.
 */
export async function batchDeleteRefs(
  db: Firestore,
  refs: DocumentReference[]
): Promise<void> {
  for (let i = 0; i < refs.length; i += BATCH_DELETE_LIMIT) {
    const batch = writeBatch(db);
    refs.slice(i, i + BATCH_DELETE_LIMIT).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}
