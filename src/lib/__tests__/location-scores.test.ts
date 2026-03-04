import { describe, it, expect } from "vitest";
import { computeWalkScore, computeDriveScore } from "../location-scores";
import type { AmenityResult, AmenityCategory } from "@/types/location";

function amenity(
  overrides: Partial<AmenityResult> & { category: AmenityCategory; distanceMeters: number }
): AmenityResult {
  return {
    name: "Test Place",
    latitude: 40.7,
    longitude: -74.0,
    rating: 4.0,
    address: "123 Test St",
    ...overrides,
  };
}

describe("computeWalkScore", () => {
  it("returns 0 for empty amenities", () => {
    expect(computeWalkScore([])).toBe(0);
  });

  it("returns 0 when all amenities are outside walk radius (400m)", () => {
    const amenities = [
      amenity({ category: "restaurant", distanceMeters: 500 }),
      amenity({ category: "cafe", distanceMeters: 800 }),
    ];
    expect(computeWalkScore(amenities)).toBe(0);
  });

  it("scores higher for closer amenities (distance decay)", () => {
    const close = [amenity({ category: "restaurant", distanceMeters: 50 })];
    const far = [amenity({ category: "restaurant", distanceMeters: 350 })];
    expect(computeWalkScore(close)).toBeGreaterThan(computeWalkScore(far));
  });

  it("caps at MAX_PER_CATEGORY (5) per category", () => {
    // 6 restaurants all at 0m — only 5 should count
    const sixRestaurants = Array.from({ length: 6 }, (_, i) =>
      amenity({ category: "restaurant", distanceMeters: 10 * (i + 1), name: `Restaurant ${i}` })
    );
    const fiveRestaurants = sixRestaurants.slice(0, 5);
    expect(computeWalkScore(sixRestaurants)).toBe(computeWalkScore(fiveRestaurants));
  });

  it("respects category weights (transit > restaurant > cafe)", () => {
    // Single transit station should score more than single cafe at same distance
    const transit = [amenity({ category: "transit_station", distanceMeters: 100 })];
    const cafe = [amenity({ category: "cafe", distanceMeters: 100 })];
    expect(computeWalkScore(transit)).toBeGreaterThan(computeWalkScore(cafe));
  });

  it("amenity at 0m gets full weight", () => {
    // Single restaurant at 0m: weight 1.5, factor 1.0
    // maxRaw = 5 * (1.5+1.0+1.0+2.0+0.8+0.8+1.0+1.5) = 5 * 9.6 = 48
    // rawScore = 1.5 * 1.0 = 1.5
    // normalized = round((1.5/48)*100) = round(3.125) = 3
    const result = computeWalkScore([
      amenity({ category: "restaurant", distanceMeters: 0 }),
    ]);
    expect(result).toBe(3);
  });

  it("amenity at exactly the radius boundary scores 0 contribution", () => {
    const atBoundary = [amenity({ category: "restaurant", distanceMeters: 400 })];
    expect(computeWalkScore(atBoundary)).toBe(0);
  });

  it("returns score capped at 100", () => {
    // Fill every category with 5 amenities at 0m distance
    const maxAmenities: AmenityResult[] = [];
    const categories: AmenityCategory[] = [
      "restaurant", "cafe", "gym", "transit_station",
      "bank", "pharmacy", "park", "supermarket",
    ];
    for (const cat of categories) {
      for (let i = 0; i < 5; i++) {
        maxAmenities.push(amenity({ category: cat, distanceMeters: 0, name: `${cat}-${i}` }));
      }
    }
    expect(computeWalkScore(maxAmenities)).toBe(100);
  });

  it("mixed categories produce expected score range", () => {
    const mixed = [
      amenity({ category: "restaurant", distanceMeters: 100 }),
      amenity({ category: "cafe", distanceMeters: 200 }),
      amenity({ category: "transit_station", distanceMeters: 150 }),
      amenity({ category: "park", distanceMeters: 300 }),
    ];
    const score = computeWalkScore(mixed);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe("computeDriveScore", () => {
  it("returns 0 for empty amenities", () => {
    expect(computeDriveScore([])).toBe(0);
  });

  it("uses 1600m radius (includes amenities outside 400m)", () => {
    const amenities = [
      amenity({ category: "restaurant", distanceMeters: 800 }),
      amenity({ category: "cafe", distanceMeters: 1200 }),
    ];
    expect(computeDriveScore(amenities)).toBeGreaterThan(0);
    // Same amenities would score 0 for walk score since they're outside 400m
    expect(computeWalkScore(amenities)).toBe(0);
  });

  it("scores higher than walk score for same amenities in 400-1600m range", () => {
    const amenities = [
      amenity({ category: "restaurant", distanceMeters: 500 }),
      amenity({ category: "transit_station", distanceMeters: 600 }),
      amenity({ category: "supermarket", distanceMeters: 800 }),
    ];
    // These are all outside walk radius but inside drive radius
    expect(computeDriveScore(amenities)).toBeGreaterThan(0);
    expect(computeWalkScore(amenities)).toBe(0);
  });

  it("returns 0 when all amenities are outside drive radius", () => {
    const farAway = [
      amenity({ category: "restaurant", distanceMeters: 2000 }),
      amenity({ category: "cafe", distanceMeters: 3000 }),
    ];
    expect(computeDriveScore(farAway)).toBe(0);
  });

  it("amenity at boundary (1600m) scores 0", () => {
    const atBoundary = [amenity({ category: "restaurant", distanceMeters: 1600 })];
    expect(computeDriveScore(atBoundary)).toBe(0);
  });

  it("prefers closer amenities when category cap is reached", () => {
    // 6 restaurants: 5 close ones + 1 far one
    // Only the 5 closest should count (sorted by distance)
    const withFar = [
      ...Array.from({ length: 5 }, (_, i) =>
        amenity({ category: "restaurant", distanceMeters: 100 * (i + 1), name: `Close ${i}` })
      ),
      amenity({ category: "restaurant", distanceMeters: 1500, name: "Far" }),
    ];
    const onlyClose = withFar.slice(0, 5);
    expect(computeDriveScore(withFar)).toBe(computeDriveScore(onlyClose));
  });
});
