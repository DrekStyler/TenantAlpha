import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { unauthorized, notFound, forbidden, badRequest } from "@/lib/api";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { PDFDocument } from "@/components/pdf/PDFDocument";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const body = await req.json();
  const { dealId, calculationResults, aiSummary, chartImages } = body;

  if (!dealId) return badRequest("dealId is required");
  if (!calculationResults) return badRequest("calculationResults is required");

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      options: { orderBy: { sortOrder: "asc" } },
      aiSummary: true,
    },
  });

  if (!deal) return notFound("Deal");
  if (deal.userId !== userId) return forbidden();

  const profile = await prisma.userProfile.findUnique({
    where: { clerkUserId: userId },
  });

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
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await renderToBuffer(pdfElement as any);
  const uint8 = new Uint8Array(pdfBuffer);

  return new Response(uint8, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${deal.dealName.replace(/[^a-z0-9]/gi, "-")}-analysis.pdf"`,
    },
  });
}
