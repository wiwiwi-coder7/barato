export const FLOATING_STREAM_DELAY_MS = 2000;
export const FLOATING_STREAM_INTERVAL_MS = 340;

export type FloatingWord = {
  id: number;
  left: number;
  duration: number;
  size: number;
};

export function finishFloatingStream() {
  return { started: false, words: [] as FloatingWord[] };
}

export function createFloatingWord(id: number): FloatingWord {
  return {
    id,
    left: 3 + ((id * 37) % 92),
    duration: 17,
    size: 0.78 + (id % 4) * 0.1,
  };
}
