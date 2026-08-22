import { describe, expect, it } from "vitest";
import { validateGiftImage } from "./imageUpload";

describe("validateGiftImage", () => {
  it("accepts allowed image types within the size limit", () => {
    expect(validateGiftImage({ type: "image/webp", size: 1024 } as File)).toBeNull();
  });

  it("rejects non-image files and images over one megabyte", () => {
    expect(validateGiftImage({ type: "image/gif", size: 1024 } as File)).toContain("JPG");
    expect(validateGiftImage({ type: "image/png", size: 1 * 1024 * 1024 + 1 } as File)).toContain("۱ مگابایت");
  });
});
