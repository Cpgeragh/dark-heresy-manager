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
