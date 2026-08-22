export function createGiftMomentCycle() {
  let running = false;

  return {
    start() {
      if (running) return false;
      running = true;
      return true;
    },
    finish() {
      running = false;
    },
  };
}

export function shouldShowGiftStartHint(hasStarted: boolean) {
  return !hasStarted;
}

export function startGiftAudio(audio: HTMLAudioElement | null) {
  if (!audio) return;
  audio.currentTime = 0;
  void audio.play().catch(() => undefined);
}
