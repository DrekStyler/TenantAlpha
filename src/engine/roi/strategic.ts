import type { StrategicROI, StrategicInput } from "./types";

/**
 * Score talent attraction based on location and amenities (1-10).
 */
export function scoreTalentAttraction(
  walkScore: number,
  transitAccess: boolean,
  amenityCount: number,
  buildingClass: "A" | "B" | "C"
): number {
  let score = 3; // baseline

  // Walk score contribution (0-3 points)
  if (walkScore >= 90) score += 3;
  else if (walkScore >= 70) score += 2;
  else if (walkScore >= 50) score += 1;

  // Transit (0-1.5 points)
  if (transitAccess) score += 1.5;

  // Amenities (0-1.5 points)
  if (amenityCount >= 8) score += 1.5;
  else if (amenityCount >= 5) score += 1;
  else if (amenityCount >= 3) score += 0.5;

  // Building class (0-1 point)
  if (buildingClass === "A") score += 1;
  else if (buildingClass === "B") score += 0.5;

  return Math.min(10, Math.round(score * 10) / 10);
}

/**
 * Score client experience (1-10).
 */
export function scoreClientExperience(
  buildingClass: "A" | "B" | "C",
  submarketPrestige: "HIGH" | "MEDIUM" | "LOW",
  amenityCount: number
): number {
  let score = 3;

  // Building class (0-3)
  if (buildingClass === "A") score += 3;
  else if (buildingClass === "B") score += 1.5;

  // Submarket (0-2)
  if (submarketPrestige === "HIGH") score += 2;
  else if (submarketPrestige === "MEDIUM") score += 1;

  // Amenities (0-2)
  if (amenityCount >= 6) score += 2;
  else if (amenityCount >= 3) score += 1;

  return Math.min(10, Math.round(score * 10) / 10);
}

/**
 * Score market presence (1-10).
 */
export function scoreMarketPresence(
  submarketPrestige: "HIGH" | "MEDIUM" | "LOW",
  buildingClass: "A" | "B" | "C",
  signageAvailable: boolean
): number {
  let score = 3;

  if (submarketPrestige === "HIGH") score += 3;
  else if (submarketPrestige === "MEDIUM") score += 1.5;

  if (buildingClass === "A") score += 2;
  else if (buildingClass === "B") score += 1;

  if (signageAvailable) score += 1.5;

  return Math.min(10, Math.round(score * 10) / 10);
}

/**
 * Score regulatory alignment (1-10).
 * Industry-specific: SCIF for aerospace, HIPAA for medical, etc.
 */
export function scoreRegulatoryAlignment(
  industryType: string,
  industryInputs: Record<string, unknown>
): number {
  let score = 5; // baseline — no specific regulatory needs

  switch (industryType) {
    case "MEDICAL":
      // ADA compliance, HIPAA, patient flow
      score = 7;
      break;
    case "AEROSPACE_DEFENSE":
      if (industryInputs.scifRequired) score = 9;
      else if (industryInputs.itarCompliant) score = 8;
      else score = 6;
      break;
    case "LEGAL":
      if (industryInputs.courtProximityRequired) score = 8;
      else score = 6;
      break;
    case "FINANCIAL":
      if (industryInputs.complianceLevel === "BANKING") score = 9;
      else if (industryInputs.complianceLevel === "FINRA") score = 8;
      else if (industryInputs.complianceLevel === "SEC_REGISTERED") score = 7;
      else score = 5;
      break;
    default:
      score = 5;
  }

  return Math.min(10, score);
}

/**
 * Calculate complete Strategic ROI.
 */
export function calculateStrategicROI(input: StrategicInput): StrategicROI {
  const talentAttractionScore = scoreTalentAttraction(
    input.walkScore,
    input.transitAccess,
    input.amenityCount,
    input.buildingClass
  );

  const clientExperienceScore = scoreClientExperience(
    input.buildingClass,
    input.submarketPrestige,
    input.amenityCount
  );

  const marketPresenceScore = scoreMarketPresence(
    input.submarketPrestige,
    input.buildingClass,
    input.signageAvailable
  );

  const regulatoryAlignmentScore = scoreRegulatoryAlignment(
    input.industryType,
    input.industryInputs
  );

  // Weighted composite (talent 35%, client 25%, market 20%, regulatory 20%)
  const compositeStrategicScore =
    talentAttractionScore * 0.35 +
    clientExperienceScore * 0.25 +
    marketPresenceScore * 0.20 +
    regulatoryAlignmentScore * 0.20;

  // Estimate revenue impact: composite score × baseline revenue × factor
  // Higher strategic score → greater revenue retention/growth
  const impactFactor = (compositeStrategicScore - 5) / 100; // ±5% centered at score 5
  const estimatedRevenueImpact = Math.round(
    input.annualRevenue * impactFactor
  );

  return {
    talentAttractionScore,
    clientExperienceScore,
    marketPresenceScore,
    regulatoryAlignmentScore,
    compositeStrategicScore: Math.round(compositeStrategicScore * 10) / 10,
    estimatedRevenueImpact,
  };
}
