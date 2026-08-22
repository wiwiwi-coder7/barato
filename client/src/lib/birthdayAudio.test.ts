import { describe, expect, it, vi } from "vitest";
import { stopAndResetBirthdayAudio } from "./birthdayAudio";

describe("birthday engine audio safety", () => {
  it("pauses and rewinds the engine sound when the hold interaction ends", () => {
    const audio = { pause: vi.fn(), currentTime: 9 };
    stopAndResetBirthdayAudio(audio);
    expect(audio.pause).toHaveBeenCalledOnce();
    expect(audio.currentTime).toBe(0);
  });

  it("accepts a missing audio element during cleanup", () => {
    expect(() => stopAndResetBirthdayAudio(null)).not.toThrow();
  });
});
