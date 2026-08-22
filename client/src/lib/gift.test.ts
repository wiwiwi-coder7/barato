import { describe, expect, it } from "vitest";
import { PERSONAL_MESSAGE_MAX_LENGTH, giftDisplayText, giftPath } from "./gift";

describe("giftDisplayText", () => {
  it("uses the required localized message format", () => {
    expect(giftDisplayText("یلدا")).toBe("یلدا دوستت دارم");
    expect(giftDisplayText("Yalda", "en")).toBe("Yalda I love you");
    expect(giftDisplayText("يَلدا", "ar")).toBe("يَلدا أحبك");
  });

  it("uses a hash route for public GitHub Pages gift links", () => {
    expect(giftPath("token-123", "/barato/")).toBe("/barato/#/gift/token-123");
  });

  it("keeps long personal notes available without an artificially short limit", () => {
    expect(PERSONAL_MESSAGE_MAX_LENGTH).toBe(1000);
  });
});
