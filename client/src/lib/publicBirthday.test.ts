import { describe, expect, it } from "vitest";
import { candleDigitsForAge, isBirthdayBackgroundColor, isBirthdayPrompt, isValidBirthdayAge, shouldRenderNumberCandles } from "./publicBirthday";

describe("public birthday candle rules", () => {
  it("maps a two-digit age to individual number candles", () => {
    expect(candleDigitsForAge(17)).toEqual(["1", "7"]);
  });

  it("keeps one digit for ages below ten and rejects invalid ages", () => {
    expect(candleDigitsForAge(7)).toEqual(["7"]);
    expect(candleDigitsForAge(100)).toEqual([]);
    expect(isValidBirthdayAge(0)).toBe(true);
    expect(isValidBirthdayAge(99)).toBe(true);
    expect(isValidBirthdayAge(100)).toBe(false);
  });

  it("never layers number candles on a cake that already has candles", () => {
    expect(shouldRenderNumberCandles(false)).toBe(true);
    expect(shouldRenderNumberCandles(true)).toBe(false);
  });

  it("accepts a concise public prompt and a six-digit background color only", () => {
    expect(isBirthdayPrompt("آرزو کن و شمع را فوت کن")).toBe(true);
    expect(isBirthdayPrompt(" ")).toBe(false);
    expect(isBirthdayBackgroundColor("#8D1F85")).toBe(true);
    expect(isBirthdayBackgroundColor("purple")).toBe(false);
  });
});
