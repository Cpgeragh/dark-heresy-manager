import {
  documentId,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  type DocumentData,
  type DocumentReference,
  type DocumentSnapshot,
  type Query,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { PRODUCT_LIMITS } from "../constants/productLimits";

const PREFLIGHT_PAGE_SIZE = 100;

export interface DestructiveOperationPreflight {
  affectedDocuments: number;
  limit: number;
  safe: boolean;
  targetExists: boolean;
  counts: Record<string, number>;
  reason?: string;
}

/**
 * Collects at most limit + 1 document references. The extra reference proves
 * an operation is too large without reading the rest of an unbounded tree.
 */
export class BoundedDeletionCollector {
  private readonly collectedRefs: DocumentReference[] = [];
  private readonly collectedCounts: Record<string, number> = {};
  readonly limit: number;

  constructor(limit: number = PRODUCT_LIMITS.bulkOperationDocuments) {
    this.limit = limit;
  }

  get exceeded(): boolean {
    return this.collectedRefs.length > this.limit;
  }

  get affectedDocuments(): number {
    return this.collectedRefs.length;
  }

  get counts(): Record<string, number> {
    return { ...this.collectedCounts };
  }

  addSnapshot(snapshot: DocumentSnapshot, category: string): void {
    if (!snapshot.exists() || this.exceeded) return;
    this.addReference(snapshot.ref, category);
  }

  addReference(reference: DocumentReference, category: string): void {
    if (this.exceeded) return;
    this.collectedRefs.push(reference);
    this.collectedCounts[category] = (this.collectedCounts[category] ?? 0) + 1;
  }

  async addQuery<AppModelType, DbModelType extends DocumentData = DocumentData>(
    source: Query<AppModelType, DbModelType>,
    category: string
  ): Promise<QueryDocumentSnapshot<AppModelType, DbModelType>[]> {
    const documents: QueryDocumentSnapshot<AppModelType, DbModelType>[] = [];
    let cursor: QueryDocumentSnapshot<AppModelType, DbModelType> | null = null;

    while (!this.exceeded) {
      const remainingProbe = this.limit + 1 - this.collectedRefs.length;
      const pageSize = Math.min(PREFLIGHT_PAGE_SIZE, remainingProbe);
      const pageQuery: Query<AppModelType, DbModelType> = cursor
        ? query(source, orderBy(documentId()), startAfter(cursor), limit(pageSize))
        : query(source, orderBy(documentId()), limit(pageSize));
      const snapshot = await getDocs(pageQuery);

      if (snapshot.empty) break;
      for (const document of snapshot.docs) {
        documents.push(document);
        this.addReference(document.ref as DocumentReference, category);
        if (this.exceeded) break;
      }

      if (this.exceeded || snapshot.docs.length < pageSize) break;
      cursor = snapshot.docs[snapshot.docs.length - 1];
    }

    return documents;
  }

  references(): DocumentReference[] {
    if (this.exceeded) {
      throw new Error(
        `This operation affects more than ${this.limit} documents and requires the protected bulk job.`
      );
    }
    return [...this.collectedRefs];
  }

  result(targetExists: boolean, reason?: string): DestructiveOperationPreflight {
    const safe = targetExists && !this.exceeded && reason === undefined;
    return {
      affectedDocuments: this.affectedDocuments,
      limit: this.limit,
      safe,
      targetExists,
      counts: this.counts,
      ...(reason ? { reason } : {}),
    };
  }
}

export function assertSafeDestructivePreflight(
  preflight: DestructiveOperationPreflight,
  label: string
): void {
  if (!preflight.targetExists) throw new Error(`${label} no longer exists.`);
  if (!preflight.safe) {
    throw new Error(
      preflight.reason ??
        `${label} affects more than ${preflight.limit} documents and requires the protected bulk job.`
    );
  }
}
