// hooks/useHideCursor.ts
"use client";

import { useEffect } from "react";

/**
 * Hook per nascondere il cursore dopo un periodo di inattività
 * Simula il comportamento di un dispositivo touch/mobile
 */
export function useHideCursor(timeout: number = 3000) {
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isCursorHidden = false;

    const hideCursor = () => {
      if (!isCursorHidden) {
        document.body.style.cursor = "none";
        isCursorHidden = true;
      }
    };

    const showCursor = () => {
      if (isCursorHidden) {
        document.body.style.cursor = "auto";
        isCursorHidden = false;
      }
      // Reset timeout
      clearTimeout(timeoutId);
      timeoutId = setTimeout(hideCursor, timeout);
    };

    // Eventi che mostrano il cursore
    const events = ["mousemove", "mousedown", "touchstart", "touchmove"];
    events.forEach((event) => {
      document.addEventListener(event, showCursor, { passive: true });
    });

    // Nascondi cursore inizialmente dopo timeout
    timeoutId = setTimeout(hideCursor, timeout);

    return () => {
      clearTimeout(timeoutId);
      events.forEach((event) => {
        document.removeEventListener(event, showCursor);
      });
      document.body.style.cursor = "auto";
    };
  }, [timeout]);
}

