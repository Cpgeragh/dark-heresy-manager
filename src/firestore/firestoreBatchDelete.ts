import { writeBatch, type DocumentReference, type Firestore } from "firebase/firestore";
import { PRODUCT_LIMITS } from "../constants/productLimits";
import { assertBulkOperationCount } from "./firebaseValidation";

const BATCH_DELETE_LIMIT = PRODUCT_LIMITS.bulkOperationDocuments;

/**
 * Deletes every given document reference, committing in chunks safely under
 * Firestore's 500-operation batch limit.
 */
export async function batchDeleteRefs(db: Firestore, refs: DocumentReference[]): Promise<void> {
  for (let i = 0; i < refs.length; i += BATCH_DELETE_LIMIT) {
    const page = refs.slice(i, i + BATCH_DELETE_LIMIT);
    assertBulkOperationCount(page.length, "Batch deletion page");
    const batch = writeBatch(db);
    page.forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

/**
 * Deletes one already-preflighted reference set in a single atomic batch.
 * Destructive client operations use this instead of chunking so a failure
 * cannot leave half of the approved document set deleted.
 */
export async function deleteRefsAtomically(
  db: Firestore,
  refs: DocumentReference[]
): Promise<void> {
  assertBulkOperationCount(refs.length, "Atomic deletion");
  if (refs.length === 0) return;

  const batch = writeBatch(db);
  refs.forEach((ref) => batch.delete(ref));
  await batch.commit();
}
