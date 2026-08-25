// functions/tests/operations/cancelBulkJob.test.ts
import { describe, it, expect, vi } from "vitest";
import { cancelBulkJob } from "../../src/operations/cancelBulkJob";

const { mockCancelBulkJob } = vi.hoisted(() => ({
  mockCancelBulkJob: vi.fn(),
}));

vi.mock("../../src/shared/bulkJobs", () => ({
  cancelBulkJob: mockCancelBulkJob,
}));

describe("cancelBulkJob (operation)", () => {
  it("delegates to the shared bulkJobs.cancelBulkJob with the caller's uid", async () => {
    mockCancelBulkJob.mockResolvedValue(undefined);

    await cancelBulkJob({ jobId: "job-1" }, "user-1");

    expect(mockCancelBulkJob).toHaveBeenCalledWith("job-1", "user-1");
  });

  it("propagates a rejection from the shared implementation", async () => {
    mockCancelBulkJob.mockRejectedValue(new Error("nope"));

    await expect(cancelBulkJob({ jobId: "job-1" }, "user-1")).rejects.toThrow("nope");
  });
});
