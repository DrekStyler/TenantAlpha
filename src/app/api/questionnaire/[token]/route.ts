import { prisma } from "@/lib/prisma";
import { questionnaireSchema } from "@/schemas/client";
import { ok, notFound, badRequest } from "@/lib/api";

// GET: Fetch client info for the questionnaire page (public, no auth)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const client = await prisma.client.findUnique({
    where: { token },
    select: {
      name: true,
      company: true,
      questionnaireCompletedAt: true,
      user: {
        select: { name: true, brokerageName: true },
      },
    },
  });

  if (!client) return notFound("Questionnaire");

  return ok({
    clientName: client.name,
    company: client.company,
    alreadyCompleted: !!client.questionnaireCompletedAt,
    brokerName: client.user?.name,
    brokerageName: client.user?.brokerageName,
  });
}

// POST: Submit questionnaire answers (public, no auth)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const client = await prisma.client.findUnique({
    where: { token },
  });
  if (!client) return notFound("Questionnaire");

  const body = await req.json();
  const parsed = questionnaireSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const { criticalAmenities, ...rest } = parsed.data;

  const updated = await prisma.client.update({
    where: { token },
    data: {
      ...rest,
      criticalAmenities: criticalAmenities
        ? JSON.stringify(criticalAmenities)
        : null,
      questionnaireCompletedAt: new Date(),
    },
  });

  return ok({ success: true, completedAt: updated.questionnaireCompletedAt });
}
