import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { unauthorized, notFound, forbidden, badRequest, tooManyRequests, ok } from "@/lib/api";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { memoRequestSchema } from "@/schemas/memo";
import { calculateDealComparison } from "@/engine";
import { prismaOptionToLeaseInput } from "@/lib/mappers";
import { generateAllSections } from "@/lib/memos/writers";
import { buildMemoDocx } from "@/lib/memos/docx";
import type { MemoAudience, MemoTone, MemoSectionId } from "@/lib/memos/types";

/** Allow up to 120s for AI generation + DOCX assembly */
export const maxDuration = 120;

// ─── POST: Generate a new memo ──────────────────────────────────

export async function POST(
  req: Request,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const rl = checkRateLimit(`memo:${userId}`, RATE_LIMITS.memo);
  if (!rl.allowed) return tooManyRequests(rl.retryAfterMs);

  const { dealId } = await params;

  const body = await req.json();
  const parsed = memoRequestSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const { memoType, audience, tone, includeSections } = parsed.data;

  // Fetch deal with options and amenities
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      options: {
        orderBy: { sortOrder: "asc" },
        include: { amenities: true },
      },
      aiSummary: true,
    },
  });

  if (!deal) return notFound("Deal");
  if (deal.userId !== userId) return forbidden();
  if (deal.options.length < 2) {
    return badRequest("At least 2 lease options are required to generate a memo");
  }

  // Run calculation engine
  const inputs = deal.options.map(prismaOptionToLeaseInput);
  const calculationResults = calculateDealComparison(inputs, {
    discountingMode: { frequency: "monthly" },
    includeTIInEffectiveRent: false,
  });

  // Build location summary for AI context
  const locationData = deal.options
    .filter((opt) => opt.walkScore != null || opt.driveScore != null)
    .map((opt) => ({
      optionName: opt.optionName,
      walkScore: opt.walkScore,
      driveScore: opt.driveScore,
      amenityCount: opt.amenities?.length ?? 0,
    }));

  // Fetch broker profile
  const profile = await prisma.userProfile.findUnique({
    where: { clerkUserId: userId },
  });

  // Snapshot inputs for audit trail
  const inputSnapshot = {
    deal: { dealName: deal.dealName, clientName: deal.clientName, propertyType: deal.propertyType },
    options: deal.options.map((o) => ({
      optionName: o.optionName,
      rentableSF: o.rentableSF,
      termMonths: o.termMonths,
      baseRentY1: o.baseRentY1,
      escalationType: o.escalationType,
      escalationPercent: o.escalationPercent,
      rentStructure: o.rentStructure,
      freeRentMonths: o.freeRentMonths,
      tiAllowance: o.tiAllowance,
      discountRate: o.discountRate,
    })),
    calculationResults: {
      bestValueOption: calculationResults.bestValueOption,
      rankedByNPV: calculationResults.rankedByNPV,
      rankedByEffectiveRent: calculationResults.rankedByEffectiveRent,
    },
  };

  try {
    // Generate AI sections
    const sections = await generateAllSections(
      audience as MemoAudience,
      tone as MemoTone,
      includeSections as MemoSectionId[],
      deal.dealName,
      deal.options,
      calculationResults,
      locationData.length > 0 ? locationData : undefined
    );

    // Build DOCX
    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const docxBuffer = await buildMemoDocx({
      dealName: deal.dealName,
      clientName: deal.clientName,
      brokerName: profile?.name,
      brokerageName: profile?.brokerageName,
      sections,
      generatedDate: today,
      audience,
      tone,
    });

    // Persist memo artifact
    await prisma.memoArtifact.create({
      data: {
        dealId,
        userId,
        memoType,
        audience,
        tone,
        includeSections,
        inputSnapshot,
        sections: JSON.parse(JSON.stringify(sections)),
        promptVersion: "v1.0.0",
        modelVersion: "claude-sonnet-4-20250514",
      },
    });

    // Mark deal as exported
    await prisma.deal.update({
      where: { id: dealId },
      data: { status: "EXPORTED" },
    });

    // Return DOCX blob
    const filename = `${deal.dealName.replace(/[^a-z0-9]/gi, "-")}-memo.docx`;
    const uint8 = new Uint8Array(docxBuffer);
    return new Response(uint8, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[memo] Generation failed:", message);

    // Persist failed attempt for debugging
    await prisma.memoArtifact.create({
      data: {
        dealId,
        userId,
        memoType,
        audience,
        tone,
        includeSections,
        inputSnapshot,
        promptVersion: "v1.0.0",
        errorMessage: message,
      },
    });

    return new Response(
      JSON.stringify({ error: `Memo generation failed: ${message}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// ─── GET: List memos for a deal ─────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const { dealId } = await params;

  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal) return notFound("Deal");
  if (deal.userId !== userId) return forbidden();

  const memos = await prisma.memoArtifact.findMany({
    where: { dealId },
    orderBy: { generatedAt: "desc" },
    select: {
      id: true,
      memoType: true,
      audience: true,
      tone: true,
      includeSections: true,
      generatedAt: true,
      errorMessage: true,
    },
  });

  return ok({ memos });
}
