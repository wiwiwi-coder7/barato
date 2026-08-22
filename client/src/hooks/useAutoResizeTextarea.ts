import { useCallback, useEffect, useRef } from "react";

export function useAutoResizeTextarea(value: string, minimum = 96, maximum = 160) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const resize = useCallback((element: HTMLTextAreaElement | null = ref.current) => {
    if (!element) return;
    element.style.height = "auto";
    const height = Math.min(Math.max(element.scrollHeight, minimum), maximum);
    element.style.height = `${height}px`;
    element.style.overflowY = element.scrollHeight > maximum ? "auto" : "hidden";
  }, [minimum, maximum]);
  useEffect(() => { resize(); }, [resize, value]);
  return { ref, resize };
}
