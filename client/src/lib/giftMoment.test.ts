import { describe, expect, it, vi } from "vitest";
import { createGiftMomentCycle, shouldShowGiftStartHint, startGiftAudio } from "./giftMoment";

describe("public gift moment", () => {
  it("starts immediately once and becomes startable again after completion", () => {
    const cycle = createGiftMomentCycle();
    expect(cycle.start()).toBe(true);
    expect(cycle.start()).toBe(false);
    cycle.finish();
    expect(cycle.start()).toBe(true);
  });

  it("resets and starts audio synchronously with the click cycle", () => {
    const audio = { currentTime: 13, play: vi.fn().mockResolvedValue(undefined) } as unknown as HTMLAudioElement;
    startGiftAudio(audio);
    expect(audio.currentTime).toBe(0);
    expect(audio.play).toHaveBeenCalledTimes(1);
  });

  it("shows the start hint only before the first successful interaction", () => {
    expect(shouldShowGiftStartHint(false)).toBe(true);
    expect(shouldShowGiftStartHint(true)).toBe(false);
  });
});
