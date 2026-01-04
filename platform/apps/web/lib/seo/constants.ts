/**
 * SEO Constants and Configuration
 * Keepr Brand - "Reservation software for places worth returning to"
 */

export const SEO_CONFIG = {
  siteName: "Keepr",
  siteUrl: process.env.NEXT_PUBLIC_APP_BASE || "https://keeprstay.com",
  defaultTitle: "Keepr - Reservation software for places worth returning to",
  defaultDescription: "Modern campground and RV park management software. Streamline reservations, payments, and guest experiences with Keepr.",
  twitterHandle: "@keepr",
  locale: "en_US",
  themeColor: "#0E4A52", // Keepr Evergreen
  keywords: [
    "campground booking",
    "RV park reservations",
    "camping software",
    "campground management",
    "outdoor hospitality",
    "glamping",
    "cabin rentals",
    "campsite booking",
    "RV resort software",
    "campground POS",
  ],
} as const;

export const getBaseUrl = () => SEO_CONFIG.siteUrl.replace(/\/+$/, "");

/**
 * Static pages for sitemap generation
 */
export const STATIC_PAGES = [
  { path: "/", priority: 1.0, changeFrequency: "daily" as const },
  { path: "/browse", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/developers", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/careers", priority: 0.6, changeFrequency: "weekly" as const },
  { path: "/case-studies", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/public-roadmap", priority: 0.5, changeFrequency: "weekly" as const },
  { path: "/signup", priority: 0.9, changeFrequency: "monthly" as const },
] as const;

/**
 * Page-specific SEO configurations
 */
export const PAGE_SEO: Record<string, { title: string; description: string; keywords?: string[] }> = {
  "/": {
    title: "Keepr - Reservation software for places worth returning to",
    description: "Modern campground and RV park management software. Streamline reservations, payments, and guest experiences with Keepr.",
    keywords: ["camping", "campground booking", "RV parks", "outdoor adventure"],
  },
  "/developers": {
    title: "Developer API - Keepr",
    description: "Integrate with Keepr's REST API. Search campgrounds, manage reservations, and sync availability programmatically.",
    keywords: ["campground API", "reservation API", "developer integration", "REST API"],
  },
  "/careers": {
    title: "Careers - Join Keepr",
    description: "Join our team building the operating system for outdoor hospitality. Remote-first roles in engineering, design, and customer success.",
    keywords: ["campground jobs", "remote jobs", "startup careers", "outdoor hospitality careers"],
  },
  "/case-studies": {
    title: "Case Studies - Keepr Success Stories",
    description: "See how campgrounds use Keepr to boost revenue, streamline operations, and delight guests with real results.",
    keywords: ["campground success stories", "RV park case studies", "hospitality software results"],
  },
  "/public-roadmap": {
    title: "Product Roadmap - Keepr",
    description: "See what we're building next. Transparent product roadmap for Keepr campground management platform.",
    keywords: ["product roadmap", "upcoming features", "campground software updates"],
  },
  "/signup": {
    title: "Get Started - Keepr",
    description: "Start your free trial of Keepr. Modern campground management software with reservations, POS, and guest portal.",
    keywords: ["campground software trial", "RV park management signup", "free campground software"],
  },
};
