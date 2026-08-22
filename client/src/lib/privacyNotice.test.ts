import { describe, expect, it } from "vitest";
import { PRIVACY_NOTICE } from "./privacyNotice";

describe("PRIVACY_NOTICE", () => {
  it("keeps the user-approved Persian privacy text unchanged", () => {
    expect(PRIVACY_NOTICE).toBe("کاربر گرامی هیچگونه اطلاعات شخصی شما فاش نمیشود");
  });
});
