import { describe, it, expect, vi } from "vitest";
import { driveJobToCompletion } from "../../src/firestore/bulkJobClient";

describe("driveJobToCompletion", () => {
  it("calls processChunk exactly once when the first chunk already reports done", async () => {
    const processChunk = vi
      .fn()
      .mockResolvedValue({ done: true, processedCount: 5, totalCount: 5 });

    const result = await driveJobToCompletion("job-1", processChunk);

    expect(processChunk).toHaveBeenCalledOnce();
    expect(processChunk).toHaveBeenCalledWith("job-1");
    expect(result).toEqual({ done: true, processedCount: 5, totalCount: 5 });
  });

  it("keeps calling processChunk until it reports done", async () => {
    const processChunk = vi
      .fn()
      .mockResolvedValueOnce({ done: false, processedCount: 2, totalCount: 6 })
      .mockResolvedValueOnce({ done: false, processedCount: 4, totalCount: 6 })
      .mockResolvedValueOnce({ done: true, processedCount: 6, totalCount: 6 });

    const result = await driveJobToCompletion("job-1", processChunk);

    expect(processChunk).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ done: true, processedCount: 6, totalCount: 6 });
  });

  it("calls onProgress after every chunk, including the last", async () => {
    const processChunk = vi
      .fn()
      .mockResolvedValueOnce({ done: false, processedCount: 2, totalCount: 4 })
      .mockResolvedValueOnce({ done: true, processedCount: 4, totalCount: 4 });
    const onProgress = vi.fn();

    await driveJobToCompletion("job-1", processChunk, onProgress);

    expect(onProgress).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenNthCalledWith(1, {
      done: false,
      processedCount: 2,
      totalCount: 4,
    });
    expect(onProgress).toHaveBeenNthCalledWith(2, { done: true, processedCount: 4, totalCount: 4 });
  });

  it("propagates a rejection from processChunk and stops calling it further", async () => {
    const error = new Error("chunk failed");
    const processChunk = vi.fn().mockRejectedValue(error);

    await expect(driveJobToCompletion("job-1", processChunk)).rejects.toBe(error);
    expect(processChunk).toHaveBeenCalledOnce();
  });
});
