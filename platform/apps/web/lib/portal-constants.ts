// Portal-wide constants for consistency across all guest portal pages

// Auth token key - use this everywhere instead of hardcoded strings
export const GUEST_TOKEN_KEY = "campreserv:guestToken";

// Animation configurations matching onboarding design
export const SPRING_CONFIG = {
  type: "spring" as const,
  stiffness: 200,
  damping: 20,
};

export const STAGGER_DELAY = 0.05;

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export const fadeInDown = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
};

// Status color mapping using theme tokens
export const STATUS_VARIANTS = {
  success: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800/30",
  },
  warning: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800/30",
  },
  error: {
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-200 dark:border-red-800/30",
  },
  info: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800/30",
  },
  neutral: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
  },
} as const;

export type StatusVariant = keyof typeof STATUS_VARIANTS;
