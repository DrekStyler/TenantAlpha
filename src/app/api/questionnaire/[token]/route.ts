import { prisma } from "@/lib/prisma";
import { questionnaireSchema } from "@/schemas/client";
import { ok, notFound, badRequest, err, tooManyRequests } from "@/lib/api";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

function isTokenExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false; // legacy tokens without expiry
  return new Date() > expiresAt;
}

// GET: Fetch client info for the questionnaire page (public, no auth)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const rl = checkRateLimit(`q:${token}`, RATE_LIMITS.questionnaire);
  if (!rl.allowed) return tooManyRequests(rl.retryAfterMs);

  const client = await prisma.client.findUnique({
    where: { token },
    select: {
      name: true,
      company: true,
      questionnaireCompletedAt: true,
      tokenExpiresAt: true,
      user: {
        select: { name: true, brokerageName: true },
      },
    },
  });

  if (!client) return notFound("Questionnaire");

  if (isTokenExpired(client.tokenExpiresAt)) {
    return err("This questionnaire link has expired. Please request a new one from your broker.", 410);
  }

  return ok({
    clientName: client.name,
    company: client.company,
    alreadyCompleted: !!client.questionnaireCompletedAt,
    brokerName: client.user?.name,
    brokerageName: client.user?.brokerageName,
  });
}

// POST: Submit questionnaire answers (public, no auth — single-use)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const rl = checkRateLimit(`q:${token}`, RATE_LIMITS.questionnaire);
  if (!rl.allowed) return tooManyRequests(rl.retryAfterMs);

  const client = await prisma.client.findUnique({
    where: { token },
  });
  if (!client) return notFound("Questionnaire");

  // Check token expiry
  if (isTokenExpired(client.tokenExpiresAt)) {
    return err("This questionnaire link has expired. Please request a new one from your broker.", 410);
  }

  // Enforce single-use: reject if already completed
  if (client.questionnaireCompletedAt) {
    return err("This questionnaire has already been submitted.", 409);
  }

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
