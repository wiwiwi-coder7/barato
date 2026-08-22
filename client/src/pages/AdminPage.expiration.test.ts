import { describe, expect, it } from "vitest";
import { formatGiftExpiration } from "./AdminPage";

describe("admin expiration status", () => {
  const now = Date.parse("2026-08-13T12:00:00.000Z");

  it("shows no-expiration status when no deadline is configured", () => {
    expect(formatGiftExpiration(null, now)).toBe("بدون انقضا");
  });

  it("shows expired status at and after the deadline", () => {
    expect(formatGiftExpiration("2026-08-13T11:59:59.000Z", now)).toBe("منقضی‌شده");
    expect(formatGiftExpiration("2026-08-13T12:00:00.000Z", now)).toBe("منقضی‌شده");
  });

  it("shows the localized deadline for an active link", () => {
    const result = formatGiftExpiration("2026-08-14T12:00:00.000Z", now);
    expect(result.startsWith("تا ")).toBe(true);
    expect(result).not.toBe("منقضی‌شده");
  });
});
