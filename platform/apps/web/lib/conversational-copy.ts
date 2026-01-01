/**
 * Conversational copy replacements for a more friendly, human tone.
 * Use these throughout the app for consistent personality.
 */

export const conversationalCopy = {
  // Form labels
  labels: {
    search: "Find Your Spot",
    location: "Where to?",
    checkIn: "Arrive",
    checkOut: "Depart",
    guests: "Adventurers",
    adults: "Adults",
    children: "Little Explorers",
    infants: "Tiny Travelers",
    pets: "Furry Friends",
    email: "Your Email",
    password: "Your Secret",
    name: "What Should We Call You?",
    phone: "How to Reach You",
  },

  // Button text
  buttons: {
    search: "Find Your Spot",
    book: "Reserve Your Adventure",
    bookNow: "Claim This Spot",
    continue: "Keep Going",
    next: "Next Step",
    back: "Go Back",
    cancel: "Never Mind",
    confirm: "Lock It In",
    save: "Save Changes",
    submit: "Send It",
    signIn: "Welcome Back",
    signUp: "Join the Adventure",
    signOut: "Hit the Trail",
    viewMore: "Discover More",
    viewAll: "See Everything",
    learnMore: "Tell Me More",
    getStarted: "Let's Go",
    tryItFree: "Start for Free",
    contactUs: "Say Hello",
  },

  // Loading states
  loading: {
    default: "Finding your perfect spot...",
    search: "Scouting the best campgrounds...",
    booking: "Securing your reservation...",
    payment: "Processing your payment...",
    profile: "Loading your profile...",
    campgrounds: "Discovering campgrounds...",
    reviews: "Gathering campfire stories...",
    photos: "Loading adventure shots...",
    map: "Drawing the map...",
  },

  // Success messages
  success: {
    booking: "You're all set! Adventure awaits.",
    payment: "Payment received. See you at the campground!",
    review: "Thanks for sharing your story!",
    profile: "Profile updated successfully.",
    wishlist: "Added to your bucket list!",
    message: "Message sent! We'll get back to you soon.",
  },

  // Error messages
  errors: {
    generic: "Oops! Something went wrong on our end.",
    network: "Looks like you lost signal. Check your connection.",
    notFound: "We couldn't find what you're looking for.",
    unauthorized: "You'll need to sign in for that.",
    forbidden: "That trail is closed to visitors.",
    validation: "Please check your information and try again.",
    payment: "Payment couldn't be processed. Let's try again.",
    booking: "This spot just got taken. Let's find another!",
  },

  // Empty states
  empty: {
    search: "Even our best scouts came up empty",
    wishlist: "Your adventure bucket list is waiting",
    reservations: "Your camping calendar is wide open",
    reviews: "Be the first to share your campfire stories",
    messages: "Your inbox is enjoying the silence",
    notifications: "All caught up!",
  },

  // Placeholders
  placeholders: {
    search: "Search campgrounds, RV parks, cabins...",
    location: "City, state, or region",
    email: "you@example.com",
    phone: "(555) 123-4567",
    review: "Share your adventure...",
    message: "Write your message...",
    name: "Your name",
    date: "Pick a date",
  },

  // Dates and times
  dates: {
    today: "Today",
    tomorrow: "Tomorrow",
    thisWeekend: "This Weekend",
    nextWeekend: "Next Weekend",
    flexible: "I'm Flexible",
    nights: (n: number) => `${n} night${n === 1 ? "" : "s"}`,
    guests: (n: number) => `${n} adventurer${n === 1 ? "" : "s"}`,
  },

  // Greetings
  greetings: {
    morning: "Rise and shine, camper!",
    afternoon: "Perfect day for adventure!",
    evening: "Golden hour at the campground",
    night: "Planning tomorrow's adventure?",
    welcome: "Welcome back, explorer!",
    goodbye: "Happy trails!",
  },

  // Misc
  misc: {
    perNight: "per night",
    totalFor: "total for",
    startingAt: "from",
    verified: "Verified Host",
    superhost: "Superhost",
    instantBook: "Instant Book",
    bestSeller: "Popular Choice",
    rareFind: "Rare Find",
    lastMinute: "Last Minute",
    trending: "Trending Now",
  },
};

// Helper function to get a copy value with fallback
export function getCopy<
  T extends keyof typeof conversationalCopy,
  K extends keyof (typeof conversationalCopy)[T]
>(category: T, key: K): string {
  const value = conversationalCopy[category]?.[key];
  if (typeof value === "function") {
    return value.toString();
  }
  return (value as string) || String(key);
}

// Type-safe helper for getting loading messages
export function getLoadingMessage(
  context: keyof typeof conversationalCopy.loading = "default"
): string {
  return conversationalCopy.loading[context] || conversationalCopy.loading.default;
}

// Type-safe helper for getting error messages
export function getErrorMessage(
  type: keyof typeof conversationalCopy.errors = "generic"
): string {
  return conversationalCopy.errors[type] || conversationalCopy.errors.generic;
}
