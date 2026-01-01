"use client";

import { useState, useEffect, useMemo } from "react";
import { useReducedMotion } from "framer-motion";

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";
export type Season = "spring" | "summer" | "fall" | "winter";

export interface TemporalContext {
  timeOfDay: TimeOfDay;
  season: Season;
  hour: number;
  isReducedMotion: boolean;
}

/**
 * Hook for detecting time of day, season, and motion preferences.
 * Used for time-aware greetings, seasonal effects, and accessibility.
 */
export function useTemporalContext(): TemporalContext {
  const [hour, setHour] = useState<number>(() => {
    if (typeof window === "undefined") return 12; // SSR default
    return new Date().getHours();
  });

  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // Set initial hour on client
    setHour(new Date().getHours());

    // Update hour every minute
    const interval = setInterval(() => {
      setHour(new Date().getHours());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const timeOfDay = useMemo((): TimeOfDay => {
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 21) return "evening";
    return "night";
  }, [hour]);

  const season = useMemo((): Season => {
    const month = new Date().getMonth();
    // Spring: March (2) - May (4)
    if (month >= 2 && month <= 4) return "spring";
    // Summer: June (5) - August (7)
    if (month >= 5 && month <= 7) return "summer";
    // Fall: September (8) - November (10)
    if (month >= 8 && month <= 10) return "fall";
    // Winter: December (11) - February (1)
    return "winter";
  }, []);

  return {
    timeOfDay,
    season,
    hour,
    isReducedMotion: prefersReducedMotion ?? false,
  };
}
