import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { unauthorized, notFound, forbidden, badRequest, tooManyRequests, err } from "@/lib/api";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { PDFDocument } from "@/components/pdf/PDFDocument";
import { pdfRequestSchema } from "@/schemas/api";

/** PDF requests can be large due to chart image data URLs */
const MAX_PDF_BODY_SIZE = 5 * 1024 * 1024;

export const maxDuration = 60;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const rl = checkRateLimit(`pdf:${userId}`, RATE_LIMITS.pdf);
  if (!rl.allowed) return tooManyRequests(rl.retryAfterMs);

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_PDF_BODY_SIZE) {
    return err("Request body too large", 413);
  }

  const body = await req.json();
  const parsed = pdfRequestSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const { dealId, calculationResults, aiSummary, chartImages } = parsed.data;

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

  const profile = await prisma.userProfile.findUnique({
    where: { clerkUserId: userId },
  });

  // Build location data for PDF — include ALL options (even un-geocoded)
  const locationData = deal.options.map((opt) => ({
    optionName: opt.optionName,
    propertyAddress: opt.propertyAddress,
    formattedAddress: opt.formattedAddress,
    walkScore: opt.walkScore,
    driveScore: opt.driveScore,
    amenities: (opt.amenities ?? []).map((a) => ({
      category: a.category,
      name: a.name,
      latitude: a.latitude,
      longitude: a.longitude,
      distanceMeters: a.distanceMeters,
      rating: a.rating,
      address: a.address,
    })),
  }));

  // Mark deal as exported
  await prisma.deal.update({
    where: { id: dealId },
    data: { status: "EXPORTED" },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfElement = React.createElement(PDFDocument as any, {
    deal,
    options: deal.options,
    calculationResults,
    aiSummary: aiSummary ?? deal.aiSummary?.summaryText ?? "",
    chartImages: chartImages ?? {},
    brokerProfile: profile,
    locationData: locationData.length > 0 ? locationData : null,
  });

  let pdfBuffer: Buffer;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pdfBuffer = await renderToBuffer(pdfElement as any);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[pdf] renderToBuffer failed:", message);
    return new Response(JSON.stringify({ error: `PDF generation failed: ${message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const uint8 = new Uint8Array(pdfBuffer);

  return new Response(uint8, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${deal.dealName.replace(/[^a-z0-9]/gi, "-")}-analysis.pdf"`,
    },
  });
}
