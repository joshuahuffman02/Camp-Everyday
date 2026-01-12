/**
 * Maps amenity names to clay icon paths
 * Returns the icon path if we have a clay icon, null otherwise
 */

const CLAY_ICON_MAP: Record<string, string> = {
  // Connectivity
  wifi: "/images/icons/wifi.png",
  "wi-fi": "/images/icons/wifi.png",
  internet: "/images/icons/wifi.png",

  // Facilities
  laundry: "/images/icons/laundry.png",
  "laundry facilities": "/images/icons/laundry.png",
  "washer/dryer": "/images/icons/laundry.png",
  store: "/images/icons/store.png",
  "camp store": "/images/icons/store.png",
  "general store": "/images/icons/store.png",
  shower: "/images/icons/shower.png",
  showers: "/images/icons/shower.png",
  "hot showers": "/images/icons/shower.png",
  bathhouse: "/images/icons/shower.png",

  // Hookups
  "full hookups": "/images/icons/full-hookups.png",
  "full hook-ups": "/images/icons/full-hookups.png",
  "full hookup": "/images/icons/full-hookups.png",
  electric: "/images/icons/electric-hookup.png",
  "electric hookup": "/images/icons/electric-hookup.png",
  "30 amp": "/images/icons/electric-hookup.png",
  "50 amp": "/images/icons/electric-hookup.png",
  "30/50 amp": "/images/icons/electric-hookup.png",
  water: "/images/icons/water-hookup.png",
  "water hookup": "/images/icons/water-hookup.png",

  // Recreation
  pool: "/images/icons/pool.png",
  "swimming pool": "/images/icons/pool.png",
  swimming: "/images/icons/pool.png",
  fishing: "/images/icons/fishing.png",
  "fishing access": "/images/icons/fishing.png",
  hiking: "/images/icons/hiking.png",
  "hiking trails": "/images/icons/hiking.png",
  trails: "/images/icons/hiking.png",
  biking: "/images/icons/biking.png",
  "bike trails": "/images/icons/biking.png",
  playground: "/images/icons/playground.png",
  "kids playground": "/images/icons/playground.png",

  // Pets
  "pet friendly": "/images/icons/pet-friendly.png",
  "pet-friendly": "/images/icons/pet-friendly.png",
  "pets allowed": "/images/icons/pet-friendly.png",
  "dogs allowed": "/images/icons/pet-friendly.png",

  // Outdoors
  campfire: "/images/icons/campfire.png",
  "fire pit": "/images/icons/campfire.png",
  "fire ring": "/images/icons/campfire.png",
  firewood: "/images/icons/campfire.png",
};

/**
 * Get the clay icon path for an amenity, if available
 */
export function getAmenityIconPath(amenity: string): string | null {
  const normalized = amenity.toLowerCase().trim();

  // Direct match
  if (CLAY_ICON_MAP[normalized]) {
    return CLAY_ICON_MAP[normalized];
  }

  // Partial match - check if any key is contained in the amenity
  for (const [key, path] of Object.entries(CLAY_ICON_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return path;
    }
  }

  return null;
}

export type ClayAmenityIcon =
  | "wifi"
  | "laundry"
  | "store"
  | "shower"
  | "full-hookups"
  | "electric-hookup"
  | "water-hookup"
  | "pool"
  | "fishing"
  | "hiking"
  | "biking"
  | "playground"
  | "pet-friendly"
  | "campfire";

/**
 * List of all available clay amenity icons
 */
export const AVAILABLE_CLAY_ICONS: ClayAmenityIcon[] = [
  "wifi",
  "laundry",
  "store",
  "shower",
  "full-hookups",
  "electric-hookup",
  "water-hookup",
  "pool",
  "fishing",
  "hiking",
  "biking",
  "playground",
  "pet-friendly",
  "campfire",
];
