import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { unauthorized, badRequest, ok, err } from "@/lib/api";

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

  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  const bucketName = process.env.GCS_BUCKET_NAME;

  if (!credentialsJson || !bucketName) {
    // GCS not configured — store logo as a base64 data URL as fallback
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString("base64");
      const logoUrl = `data:${file.type};base64,${base64}`;

      await prisma.userProfile.upsert({
        where: { clerkUserId: userId },
        update: { logoUrl },
        create: { clerkUserId: userId, email: "", logoUrl },
      });

      return ok({ logoUrl });
    } catch (e) {
      console.error("[upload/logo] base64 fallback failed:", e);
      return err("Logo upload failed — storage not configured", 500);
    }
  }

  try {
    const { Storage } = await import("@google-cloud/storage");
    const credentials = JSON.parse(credentialsJson);
    const storage = new Storage({
      credentials,
      projectId: process.env.GCS_PROJECT_ID,
    });

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() ?? "png";
    const filename = `logos/${userId}-${Date.now()}.${ext}`;

    const bucket = storage.bucket(bucketName);
    const gcsFile = bucket.file(filename);

    await gcsFile.save(buffer, {
      metadata: { contentType: file.type },
      public: true,
    });

    const logoUrl = `https://storage.googleapis.com/${bucketName}/${filename}`;

    await prisma.userProfile.upsert({
      where: { clerkUserId: userId },
      update: { logoUrl },
      create: { clerkUserId: userId, email: "", logoUrl },
    });

    return ok({ logoUrl });
  } catch (e) {
    console.error("[upload/logo] GCS upload failed:", e);
    return err(
      e instanceof Error ? e.message : "Logo upload failed",
      500
    );
  }
}
