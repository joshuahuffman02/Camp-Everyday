"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Image from "next/image";

// Simple, authentic activity messages
const ACTIVITIES = [
  { location: "Yellowstone", count: 23, type: "viewing" },
  { location: "Colorado", count: 18, type: "viewing" },
  { location: "Lake Tahoe", count: 31, type: "viewing" },
  { location: "Yosemite", count: 27, type: "viewing" },
  { location: "Grand Canyon", count: 15, type: "viewing" },
  { location: "Zion", count: 12, type: "viewing" },
];

interface InlineActivityFeedProps {
  className?: string;
}

export function InlineActivityFeed({ className }: InlineActivityFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // Show after a short delay
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    // Rotate through activities
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ACTIVITIES.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (prefersReducedMotion || !isVisible) {
    return null;
  }

  const activity = ACTIVITIES[currentIndex];

  return (
    <motion.div
      className={`w-full py-4 bg-gradient-to-r from-slate-50 via-white to-slate-50 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-center gap-3">
          {/* Pulsing dot */}
          <motion.div
            className="w-2 h-2 rounded-full bg-emerald-500"
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Activity text */}
          <AnimatePresence mode="wait">
            <motion.p
              key={currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-sm text-slate-600"
            >
              <span className="font-semibold text-slate-800">{activity.count} adventurers</span>
              {" "}exploring {activity.location} right now
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
