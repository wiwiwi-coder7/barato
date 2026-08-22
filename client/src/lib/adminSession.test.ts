import { describe, expect, it } from "vitest";
import { isAuthenticatedAdminSession } from "./adminSession";

describe("admin session state", () => {
  it("shows protected content only after a server-confirmed session", () => {
    expect(isAuthenticatedAdminSession({ authenticated: true })).toBe(true);
    expect(isAuthenticatedAdminSession({ authenticated: false })).toBe(false);
    expect(isAuthenticatedAdminSession(null)).toBe(false);
  });
});
