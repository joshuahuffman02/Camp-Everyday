"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScrollProgressIndicatorProps {
  /** Minimum page height to show indicator (default: 1500) */
  minHeight?: number;
  /** Custom class name */
  className?: string;
}

export function ScrollProgressIndicator({
  minHeight = 1500,
  className,
}: ScrollProgressIndicatorProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateProgress = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY;
      const progress = Math.min(1, Math.max(0, scrolled / scrollHeight));

      setScrollProgress(progress);
      setIsVisible(document.documentElement.scrollHeight > minHeight && scrolled > 100);
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [minHeight]);

  // Don't render for reduced motion or when not visible
  if (prefersReducedMotion || !isVisible) {
    return null;
  }

  const isAtSummit = scrollProgress >= 0.95;

  return (
    <motion.div
      className={cn(
        "fixed bottom-6 right-6 z-40 flex flex-col items-center gap-1",
        className
      )}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
    >
      {/* Summit flag - appears at 95%+ */}
      <motion.div
        className="text-emerald-600"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: isAtSummit ? 1 : 0, y: isAtSummit ? 0 : 5 }}
        transition={{ duration: 0.3 }}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M5 21V4h2v1h10l-4 5 4 5H7v6H5z" />
        </svg>
      </motion.div>

      {/* Mountain container */}
      <div className="relative w-12 h-16">
        {/* Mountain background (unfilled) */}
        <svg
          className="absolute inset-0 w-full h-full text-slate-200"
          viewBox="0 0 48 64"
          fill="currentColor"
        >
          <path d="M24 4L4 60H44L24 4Z" />
        </svg>

        {/* Mountain fill (progress) */}
        <div
          className="absolute bottom-0 left-0 right-0 overflow-hidden transition-all duration-150"
          style={{ height: `${scrollProgress * 100}%` }}
        >
          <svg
            className="absolute bottom-0 w-full text-emerald-500"
            viewBox="0 0 48 64"
            fill="currentColor"
            style={{ height: "64px" }}
          >
            <path d="M24 4L4 60H44L24 4Z" />
          </svg>
        </div>

        {/* Snow cap on mountain peak */}
        <svg
          className="absolute inset-0 w-full h-full text-white"
          viewBox="0 0 48 64"
          fill="currentColor"
        >
          <path d="M24 4L18 16H30L24 4Z" opacity="0.9" />
        </svg>

        {/* Climbing tent marker */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 w-4 h-4"
          style={{
            bottom: `${scrollProgress * 85}%`,
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            {/* Simple tent shape */}
            <path
              d="M12 6L4 18H20L12 6Z"
              fill="#10b981"
              stroke="#065f46"
              strokeWidth="1"
            />
            <rect x="10" y="14" width="4" height="4" fill="#065f46" />
          </svg>
        </motion.div>
      </div>

      {/* Percentage label */}
      <span className="text-xs font-medium text-slate-500 tabular-nums">
        {Math.round(scrollProgress * 100)}%
      </span>
    </motion.div>
  );
}
