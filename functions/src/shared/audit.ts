// functions/src/shared/audit.ts
//
// Stage 3.1: shared audit-record writing for protected callables. Records
// are deliberately bounded — a small number of primitive metadata fields,
// each capped in length — so a caller can't accidentally (or deliberately)
// dump an entire request payload, a Recovery Code, or other sensitive data
// into a durable log. Callers still choose which fields are safe to record
// for their own operation; this only bounds the shape.

import { getFirestore } from "firebase-admin/firestore";

const AUDIT_LOG_COLLECTION = "auditLog";
const MAX_METADATA_KEYS = 20;
const MAX_METADATA_VALUE_LENGTH = 200;

export interface AuditEntryInput {
  operation: string;
  actorUid: string;
  outcome: "success" | "failure";
  metadata?: Record<string, string | number | boolean>;
}

function assertBoundedMetadata(metadata: Record<string, string | number | boolean>): void {
  const keys = Object.keys(metadata);
  if (keys.length > MAX_METADATA_KEYS) {
    throw new Error(`Audit metadata cannot exceed ${MAX_METADATA_KEYS} fields.`);
  }
  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === "string" && value.length > MAX_METADATA_VALUE_LENGTH) {
      throw new Error(`Audit metadata field "${key}" exceeds ${MAX_METADATA_VALUE_LENGTH} characters.`);
    }
  }
}

export async function recordAuditEntry(entry: AuditEntryInput): Promise<void> {
  if (entry.metadata) assertBoundedMetadata(entry.metadata);

  const db = getFirestore();
  await db.collection(AUDIT_LOG_COLLECTION).add({
    operation: entry.operation,
    actorUid: entry.actorUid,
    outcome: entry.outcome,
    metadata: entry.metadata ?? {},
    timestamp: Date.now(),
  });
}
