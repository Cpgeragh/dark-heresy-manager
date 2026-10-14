// tests/unit/downloadTextFile.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { downloadTextFile } from "../../src/utils/downloadTextFile";

function readBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

describe("downloadTextFile", () => {
  const createObjectURL = vi.fn(() => "blob:chat");
  const revokeObjectURL = vi.fn();
  let anchor: HTMLAnchorElement;
  let click: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    click = vi.fn();
    anchor = document.createElement("a");
    anchor.click = click as unknown as () => void;
    vi.spyOn(document, "createElement").mockReturnValue(anchor);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("saves the text as a UTF-8 text file with the given name", async () => {
    downloadTextFile("chat.txt", "Hello é");

    const blob = createObjectURL.mock.calls[0][0] as unknown as Blob;
    expect(blob.type).toBe("text/plain;charset=utf-8");
    expect(await readBlob(blob)).toBe("Hello é");
    expect(anchor.download).toBe("chat.txt");
    expect(anchor.getAttribute("href")).toBe("blob:chat");
    expect(click).toHaveBeenCalledOnce();
  });

  it("releases the temporary address afterwards", () => {
    downloadTextFile("chat.txt", "x");

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:chat");
  });
});
