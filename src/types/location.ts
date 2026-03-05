export interface GeocodedLocation {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

export const AMENITY_CATEGORIES = [
  { key: "restaurant", label: "Restaurants", placeType: "restaurant", weight: 1.5, abbr: "R" },
  { key: "cafe", label: "Coffee Shops", placeType: "cafe", weight: 1.0, abbr: "C" },
  { key: "gym", label: "Gyms & Fitness", placeType: "gym", weight: 1.0, abbr: "G" },
  { key: "transit_station", label: "Transit Stations", placeType: "transit_station", weight: 2.0, abbr: "T" },
  { key: "bank", label: "Banks", placeType: "bank", weight: 0.8, abbr: "B" },
  { key: "pharmacy", label: "Pharmacies", placeType: "pharmacy", weight: 0.8, abbr: "Rx" },
  { key: "park", label: "Parks", placeType: "park", weight: 1.0, abbr: "P" },
  { key: "supermarket", label: "Grocery Stores", placeType: "supermarket", weight: 1.5, abbr: "S" },
] as const;

export type AmenityCategory = (typeof AMENITY_CATEGORIES)[number]["key"];

export interface AmenityResult {
  category: AmenityCategory;
  name: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  rating?: number;
  address?: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  formattedAddress: string | null;
  walkScore: number | null;
  driveScore: number | null;
  amenities: AmenityResult[];
  fetchedAt: string | null;
}

export interface OptionLocationSummary {
  optionId: string;
  optionName: string;
  propertyAddress: string | null;
  location: LocationData | null;
}
