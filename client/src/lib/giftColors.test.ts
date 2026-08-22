import { describe, expect, it } from "vitest";
import { GIFT_COLORS } from "@shared/colors";

const createGiftApiColors = ["#E8538A", "#9560FF", "#587AFF"];

describe("Barato gift color contract", () => {
  it("keeps every color submitted by the public form accepted by the create-gift API", () => {
    expect([...GIFT_COLORS].map(color => color.toUpperCase())).toEqual(createGiftApiColors);
  });
});
