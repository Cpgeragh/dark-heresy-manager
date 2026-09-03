// src/utils/bulkJobClient.ts
// Drives a resumable server-side job (functions/src/shared/bulkJobs.ts) to
// completion by repeatedly calling its "process next chunk" callable until
// it reports done. Shared by every client feature built on that pattern —
// identity reclaim first, the character/campaign/custom-item bulk jobs
// later — so the polling loop only exists in one place.
//
// If processChunk throws, the loop stops and the error propagates — the
// job itself stays resumable server-side (its checkpoint is untouched), so
// the caller can retry by driving the same jobId again.

interface JobChunkResult {
  done: boolean;
}

export async function driveJobToCompletion<TResult extends JobChunkResult>(
  jobId: string,
  processChunk: (jobId: string) => Promise<TResult>,
  onProgress?: (result: TResult) => void
): Promise<TResult> {
  let result: TResult;
  do {
    result = await processChunk(jobId);
    onProgress?.(result);
  } while (!result.done);
  return result;
}
