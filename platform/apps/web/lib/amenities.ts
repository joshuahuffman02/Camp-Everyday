import {
  Waves,
  Wifi,
  Dumbbell,
  Mountain,
  Footprints,
  Bike,
  Bath,
  Store,
  ShowerHead,
  Shirt,
  Baby,
  Fish,
  Ship,
  Dog,
  Gamepad2,
  Flame,
  Trash2,
  TreeDeciduous,
  Square,
  Leaf,
  type LucideIcon,
  Table2,
  Armchair,
  Sun,
  Cable,
  Wifi as WifiIcon,
} from "lucide-react";

export interface AmenityOption {
  id: string;
  label: string;
  icon: LucideIcon;
  category?: string;
}

// Park-wide amenities (stored in campground.amenities)
export const PARK_AMENITIES: AmenityOption[] = [
  { id: "pool", label: "Pool", icon: Waves, category: "recreation" },
  { id: "wifi", label: "WiFi", icon: Wifi, category: "utilities" },
  { id: "pickleball", label: "Pickleball", icon: Dumbbell, category: "recreation" },
  { id: "hiking_trails", label: "Hiking Trails", icon: Mountain, category: "outdoor" },
  { id: "walking_trails", label: "Walking Trails", icon: Footprints, category: "outdoor" },
  { id: "biking_trails", label: "Biking Trails", icon: Bike, category: "outdoor" },
  { id: "bath_house", label: "Bath House", icon: Bath, category: "facilities" },
  { id: "store", label: "Camp Store", icon: Store, category: "facilities" },
  { id: "restrooms", label: "Restrooms", icon: Bath, category: "facilities" },
  { id: "showers", label: "Showers", icon: ShowerHead, category: "facilities" },
  { id: "laundry", label: "Laundry", icon: Shirt, category: "facilities" },
  { id: "playground", label: "Playground", icon: Baby, category: "recreation" },
  { id: "fishing", label: "Fishing", icon: Fish, category: "outdoor" },
  { id: "boat_launch", label: "Boat Launch", icon: Ship, category: "outdoor" },
  { id: "dog_park", label: "Dog Park", icon: Dog, category: "recreation" },
  { id: "rec_room", label: "Rec Room", icon: Gamepad2, category: "recreation" },
  { id: "fire_pit_communal", label: "Communal Fire Pit", icon: Flame, category: "outdoor" },
  { id: "dump_station", label: "Dump Station", icon: Trash2, category: "utilities" },
];

// Site class amenities (stored in siteClass.amenityTags)
export const SITE_CLASS_AMENITIES: AmenityOption[] = [
  { id: "picnic_table", label: "Picnic Table", icon: Table2 },
  { id: "fire_pit", label: "Fire Pit", icon: Flame },
  { id: "patio", label: "Patio", icon: Armchair },
  { id: "bbq_grill", label: "BBQ Grill", icon: Flame },
  { id: "shade", label: "Shade/Trees", icon: TreeDeciduous },
  { id: "lake_view", label: "Lake View", icon: Waves },
  { id: "river_view", label: "River View", icon: Waves },
  { id: "concrete_pad", label: "Concrete Pad", icon: Square },
  { id: "grass_pad", label: "Grass Pad", icon: Leaf },
  { id: "cable_tv", label: "Cable TV", icon: Cable },
  { id: "site_wifi", label: "Site WiFi", icon: WifiIcon },
  { id: "covered", label: "Covered", icon: Sun },
];

// Helper to get amenity by id
export function getAmenityById(id: string, type: "park" | "site"): AmenityOption | undefined {
  const list = type === "park" ? PARK_AMENITIES : SITE_CLASS_AMENITIES;
  return list.find((a) => a.id === id);
}

// Helper to get amenity labels from ids
export function getAmenityLabels(ids: string[], type: "park" | "site"): string[] {
  return ids
    .map((id) => getAmenityById(id, type)?.label)
    .filter((label): label is string => !!label);
}
