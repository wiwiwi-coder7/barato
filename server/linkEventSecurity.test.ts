import { describe, expect, it } from "vitest";
import { clientMetadataFromRequest, eventRetentionCutoff, isPublicIp } from "../supabase/functions/barato-api/linkEventSecurity";

describe("gift link event privacy helpers", () => {
  it("selects a trusted public source IP and ignores private forwarding values", () => {
    const publicHeaders = new Headers({ "x-forwarded-for": "203.0.113.44, 10.0.0.8", "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) Version/18.0 Mobile/15E148 Safari/604.1" });
    expect(clientMetadataFromRequest(publicHeaders)).toMatchObject({ ip: "203.0.113.44", browser: "Safari", operatingSystem: "iOS", device: "mobile" });
    expect(isPublicIp("10.0.0.12")).toBe(false);
    expect(isPublicIp("192.168.1.12")).toBe(false);
  });

  it("uses a stable thirty-day retention boundary", () => {
    expect(eventRetentionCutoff(Date.UTC(2026, 7, 20), 30)).toBe("2026-07-21T00:00:00.000Z");
  });
});
