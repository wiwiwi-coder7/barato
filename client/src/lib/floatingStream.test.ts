import { describe, expect, it } from "vitest";
import { createFloatingWord, finishFloatingStream, FLOATING_STREAM_DELAY_MS, FLOATING_STREAM_INTERVAL_MS } from "./floatingStream";

describe("floating text stream", () => {
  it("waits exactly two seconds before starting and creates a denser steady stream", () => {
    expect(FLOATING_STREAM_DELAY_MS).toBe(2000);
    expect(FLOATING_STREAM_INTERVAL_MS).toBe(340);
  });

  it("clears all words when the audio ends", () => {
    expect(finishFloatingStream()).toEqual({ started: false, words: [] });
  });

  it("creates slow floating words with a stable vertical speed", () => {
    const word = createFloatingWord(7);
    expect(word).toMatchObject({ id: 7 });
    expect(word.duration).toBe(17);
    expect(word.left).toBeGreaterThanOrEqual(3);
    expect(word.left).toBeLessThanOrEqual(95);
  });
});
