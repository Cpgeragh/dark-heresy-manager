// functions/src/operations/cancelBulkJob.ts
//
// Stage 3, gap-audit item 17: lets the caller who started a bulk job
// deliberately stop it, so a future process*Chunk call refuses to resume it
// and a fresh start call with the same idempotency key can create a new job.

import { cancelBulkJob as cancelBulkJobRecord } from "../shared/bulkJobs.js";

export interface CancelBulkJobInput {
  jobId: string;
}

export async function cancelBulkJob(input: CancelBulkJobInput, callerUid: string): Promise<void> {
  await cancelBulkJobRecord(input.jobId, callerUid);
}
