import { describe, expect, it } from "vitest";
import { createTextGiftPayload } from "./fastGiftCreation";

describe("fast gift creation", () => {
  it("creates the public link payload without waiting for an optional image", () => {
    expect(createTextGiftPayload({ name: "نرگس", personalMessage: null, color: "#E8538A", theme: "light", expiresAt: null })).toMatchObject({
      name: "نرگس",
      message: "دوستت دارم",
      imageKey: null,
    });
  });
});
