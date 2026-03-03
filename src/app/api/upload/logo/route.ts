import { auth } from "@clerk/nextjs/server";
import { Storage } from "@google-cloud/storage";
import { prisma } from "@/lib/prisma";
import { unauthorized, badRequest, ok } from "@/lib/api";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const formData = await req.formData();
  const file = formData.get("logo") as File | null;

  if (!file) return badRequest("No file provided");
  if (!file.type.startsWith("image/"))
    return badRequest("File must be an image");
  if (file.size > 5 * 1024 * 1024)
    return badRequest("File must be under 5MB");

  // Parse GCS credentials at request time (not module load time)
  // so the build doesn't fail when env vars are absent
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  const credentials = credentialsJson ? JSON.parse(credentialsJson) : undefined;
  const storage = new Storage({
    credentials,
    projectId: process.env.GCS_PROJECT_ID,
  });

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop() ?? "png";
  const filename = `logos/${userId}-${Date.now()}.${ext}`;

  const bucket = storage.bucket(process.env.GCS_BUCKET_NAME!);
  const gcsFile = bucket.file(filename);

  await gcsFile.save(buffer, {
    metadata: { contentType: file.type },
    public: true,
  });

  const logoUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${filename}`;

  await prisma.userProfile.upsert({
    where: { clerkUserId: userId },
    update: { logoUrl },
    create: { clerkUserId: userId, email: "", logoUrl },
  });

  return ok({ logoUrl });
}
