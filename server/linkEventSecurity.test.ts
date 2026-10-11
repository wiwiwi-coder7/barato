import { describe, expect, it } from "vitest";
import { clientMetadataFromRequest, eventRetentionCutoff, isCrawlerUserAgent, isPublicIp } from "../supabase/functions/barato-api/linkEventSecurity";

describe("gift link event privacy helpers", () => {
  it("selects only the trusted Cloudflare IP header", () => {
    const publicHeaders = new Headers({
      "cf-connecting-ip": "203.0.113.44",
      "x-forwarded-for": "198.51.100.20",
      "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) Version/18.0 Mobile/15E148 Safari/604.1",
    });
    expect(clientMetadataFromRequest(publicHeaders)).toMatchObject({ ip: "203.0.113.44", browser: "Safari", operatingSystem: "iOS", device: "mobile", isCrawler: false });
    expect(clientMetadataFromRequest(new Headers({ "x-forwarded-for": "198.51.100.20" })).ip).toBeNull();
    expect(isPublicIp("10.0.0.12")).toBe(false);
    expect(isPublicIp("192.168.1.12")).toBe(false);
  });

  it("filters common link preview and crawler user agents", () => {
    expect(isCrawlerUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBe(true);
    expect(isCrawlerUserAgent("facebookexternalhit/1.1")).toBe(true);
    expect(isCrawlerUserAgent("Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36")).toBe(false);
  });

  it("uses a stable thirty-day retention boundary", () => {
    expect(eventRetentionCutoff(Date.UTC(2026, 7, 20), 30)).toBe("2026-07-21T00:00:00.000Z");
  });
});
