"use client";

import { useEffect, useRef } from "react";

interface UseFastScrollDetectorOptions {
  /** Scroll speed threshold in pixels per second (default: 8000) */
  speedThreshold?: number;
  /** Whether to only trigger when scrolling down (default: true) */
  downOnly?: boolean;
  /** Callback when fast scroll is detected */
  onFastScroll: () => void;
  /** Cooldown period between triggers in ms (default: 30000) */
  cooldown?: number;
  /** Whether detection is enabled (default: true) */
  enabled?: boolean;
}

/**
 * Hook for detecting when the user scrolls very fast.
 * Useful for easter eggs or "slow down" messages.
 */
export function useFastScrollDetector({
  speedThreshold = 8000,
  downOnly = true,
  onFastScroll,
  cooldown = 30000,
  enabled = true,
}: UseFastScrollDetectorOptions) {
  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(0);
  const lastTriggerTime = useRef(0);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const handleScroll = () => {
      const now = performance.now();
      const currentY = window.scrollY;
      const timeDelta = now - lastScrollTime.current;

      // Only calculate if we have a previous measurement and it's recent
      if (timeDelta > 0 && timeDelta < 100) {
        const scrollDelta = currentY - lastScrollY.current;
        const speed = Math.abs(scrollDelta) / (timeDelta / 1000); // pixels per second

        const isDown = scrollDelta > 0;
        const inCooldown = now - lastTriggerTime.current < cooldown;

        if (speed > speedThreshold && !inCooldown && (!downOnly || isDown)) {
          lastTriggerTime.current = now;
          onFastScroll();
        }
      }

      lastScrollY.current = currentY;
      lastScrollTime.current = now;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [speedThreshold, downOnly, onFastScroll, cooldown, enabled]);
}
