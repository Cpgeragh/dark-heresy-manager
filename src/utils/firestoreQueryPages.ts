import {
  documentId,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  writeBatch,
  type DocumentData,
  type Firestore,
  type Query,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
} from "firebase/firestore";

export const BULK_READ_PAGE_SIZE = 100;

/**
 * Reads a query in stable document-ID pages and processes one page at a time.
 * A failed caller can safely restart from the beginning when its writes are
 * idempotent; already-processed documents will simply be visited again.
 */
export async function forEachQueryPage<
  AppModelType,
  DbModelType extends DocumentData = DocumentData,
>(
  source: Query<AppModelType, DbModelType>,
  processPage: (documents: QueryDocumentSnapshot<AppModelType, DbModelType>[]) => Promise<void>,
  pageSize = BULK_READ_PAGE_SIZE
): Promise<number> {
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 450) {
    throw new Error("Firestore page size must be a whole number from 1 to 450.");
  }

  let cursor: QueryDocumentSnapshot<AppModelType, DbModelType> | null = null;
  let processed = 0;

  while (true) {
    const pageQuery: Query<AppModelType, DbModelType> = cursor
      ? query(source, orderBy(documentId()), startAfter(cursor), limit(pageSize))
      : query(source, orderBy(documentId()), limit(pageSize));
    const snapshot: QuerySnapshot<AppModelType, DbModelType> = await getDocs(pageQuery);
    if (snapshot.empty) break;

    await processPage(snapshot.docs);
    processed += snapshot.docs.length;

    if (snapshot.docs.length < pageSize) break;
    cursor = snapshot.docs[snapshot.docs.length - 1];
  }

  return processed;
}

/** Deletes a query a bounded page at a time, safely under the 500-write limit. */
export async function deleteQueryDocsInPages<
  AppModelType,
  DbModelType extends DocumentData = DocumentData,
>(
  firestore: Firestore,
  source: Query<AppModelType, DbModelType>,
  pageSize = BULK_READ_PAGE_SIZE
): Promise<number> {
  return forEachQueryPage(
    source,
    async (documents) => {
      const batch = writeBatch(firestore);
      documents.forEach((document) => batch.delete(document.ref));
      await batch.commit();
    },
    pageSize
  );
}
