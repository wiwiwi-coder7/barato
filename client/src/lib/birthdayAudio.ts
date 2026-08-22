export type ControllableAudio = Pick<HTMLAudioElement, "pause" | "currentTime">;

export function stopAndResetBirthdayAudio(audio: ControllableAudio | null | undefined) {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
}
