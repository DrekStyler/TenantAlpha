import type { AmenityResult } from "@/types/location";
import { AMENITY_CATEGORIES } from "@/types/location";

const WALK_RADIUS_M = 400;
const DRIVE_RADIUS_M = 1600;

/** Max amenities per category that contribute to score (diminishing returns) */
const MAX_PER_CATEGORY = 5;

/**
 * Linear distance decay: 1.0 at 0m, 0.0 at radius boundary.
 * Closer amenities contribute more to the score.
 */
function distanceFactor(distanceMeters: number, radiusMeters: number): number {
  return Math.max(0, 1 - distanceMeters / radiusMeters);
}

/**
 * Compute a location score (0–100) based on nearby amenities within a given radius.
 * Uses category weights, distance decay, and caps per category.
 */
function computeScore(amenities: AmenityResult[], radiusMeters: number): number {
  const categoryWeights = Object.fromEntries(
    AMENITY_CATEGORIES.map((c) => [c.key, c.weight])
  );

  let rawScore = 0;
  const categoryCounts: Record<string, number> = {};

  // Sort by distance so closest amenities are counted first
  const sorted = [...amenities]
    .filter((a) => a.distanceMeters <= radiusMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  for (const amenity of sorted) {
    const count = categoryCounts[amenity.category] ?? 0;
    if (count >= MAX_PER_CATEGORY) continue;
    categoryCounts[amenity.category] = count + 1;

    const weight = categoryWeights[amenity.category] ?? 1.0;
    const factor = distanceFactor(amenity.distanceMeters, radiusMeters);
    rawScore += weight * factor;
  }

  // Normalize: max theoretical raw score
  const maxRaw =
    MAX_PER_CATEGORY *
    AMENITY_CATEGORIES.reduce((s, c) => s + c.weight, 0);
  const normalized = Math.min(100, Math.round((rawScore / maxRaw) * 100));

  return normalized;
}

/**
 * Walk Score: amenity density within 400m (walkable distance).
 * 0 = no nearby amenities, 100 = excellent walkability.
 */
export function computeWalkScore(amenities: AmenityResult[]): number {
  return computeScore(amenities, WALK_RADIUS_M);
}

/**
 * Drive Score: amenity density within 1600m (~1 mile driving distance).
 * 0 = nothing nearby, 100 = excellent drivable access.
 */
export function computeDriveScore(amenities: AmenityResult[]): number {
  return computeScore(amenities, DRIVE_RADIUS_M);
}
