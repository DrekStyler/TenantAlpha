import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { calculateDealComparison } from "@/engine";
import type { CalculationConfig } from "@/engine/types";
import { ok, unauthorized, notFound, forbidden, badRequest } from "@/lib/api";
import { calculateRequestSchema } from "@/schemas/api";
import { prismaOptionToLeaseInput } from "@/lib/mappers";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const body = await req.json();
  const parsed = calculateRequestSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const { dealId, discountingMode, includeTIInEffectiveRent } = parsed.data;

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: { options: { orderBy: { sortOrder: "asc" } } },
  });

  if (!deal) return notFound("Deal");
  if (deal.userId !== userId) return forbidden();
  if (deal.options.length < 2)
    return badRequest("At least 2 lease options are required to calculate");

  const config: CalculationConfig = {
    discountingMode: discountingMode ?? { frequency: "monthly" },
    includeTIInEffectiveRent: includeTIInEffectiveRent ?? false,
  };

  const inputs = deal.options.map(prismaOptionToLeaseInput);

  const results = calculateDealComparison(inputs, config);

  // Mark deal as calculated
  await prisma.deal.update({
    where: { id: dealId },
    data: { status: "CALCULATED" },
  });

  return ok(results);
}
