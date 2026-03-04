import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { unauthorized, badRequest, ok, err, tooManyRequests } from "@/lib/api";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

/** Max file size: 2 MB (logos don't need to be huge) */
const MAX_FILE_SIZE = 2 * 1024 * 1024;

/** Max base64 data URL size stored in DB: 500 KB */
const MAX_BASE64_SIZE = 500 * 1024;

/** Allowed image types and their magic byte signatures */
const ALLOWED_TYPES: Record<string, number[]> = {
  "image/png": [0x89, 0x50, 0x4e, 0x47],       // ‰PNG
  "image/jpeg": [0xff, 0xd8, 0xff],              // ÿØÿ
  "image/webp": [0x52, 0x49, 0x46, 0x46],        // RIFF
  "image/svg+xml": [0x3c],                       // <  (XML start)
};

/** Allowed file extensions */
const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "svg"]);

function validateMagicBytes(buffer: Buffer, declaredType: string): boolean {
  const expected = ALLOWED_TYPES[declaredType];
  if (!expected) return false;
  if (buffer.length < expected.length) return false;
  return expected.every((byte, i) => buffer[i] === byte);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const rl = checkRateLimit(`upload:${userId}`, RATE_LIMITS.upload);
  if (!rl.allowed) return tooManyRequests(rl.retryAfterMs);

  const formData = await req.formData();
  const file = formData.get("logo") as File | null;

  if (!file) return badRequest("No file provided");

  // Validate declared MIME type
  if (!ALLOWED_TYPES[file.type]) {
    return badRequest("File must be a PNG, JPEG, WebP, or SVG image");
  }

  // Validate file extension
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return badRequest("File extension not allowed. Use .png, .jpg, .jpeg, .webp, or .svg");
  }

  if (file.size > MAX_FILE_SIZE) {
    return badRequest("File must be under 2MB");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Validate magic bytes match declared type
  if (!validateMagicBytes(buffer, file.type)) {
    return badRequest("File content does not match declared image type");
  }

  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  const bucketName = process.env.GCS_BUCKET_NAME;

  if (!credentialsJson || !bucketName) {
    // GCS not configured — store logo as a base64 data URL as fallback
    if (file.size > MAX_BASE64_SIZE) {
      return badRequest("File too large for base64 storage. Max 500KB without cloud storage configured.");
    }
    try {
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
    let credentials: Record<string, unknown>;
    try {
      credentials = JSON.parse(credentialsJson);
    } catch {
      console.error("[upload/logo] Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON — falling back to base64");
      if (file.size > MAX_BASE64_SIZE) {
        return badRequest("File too large for base64 fallback. Fix GCS credentials.");
      }
      const base64 = buffer.toString("base64");
      const logoUrl = `data:${file.type};base64,${base64}`;
      await prisma.userProfile.upsert({
        where: { clerkUserId: userId },
        update: { logoUrl },
        create: { clerkUserId: userId, email: "", logoUrl },
      });
      return ok({ logoUrl });
    }
    const storage = new Storage({
      credentials,
      projectId: process.env.GCS_PROJECT_ID,
    });

    const filename = `logos/${userId}-${Date.now()}.${ext}`;

    const bucket = storage.bucket(bucketName);
    const gcsFile = bucket.file(filename);

    await gcsFile.save(buffer, {
      metadata: { contentType: file.type },
      // Make file private; use signed URLs or IAM for access
      public: false,
    });

    // Generate a signed URL for reading (valid 7 days — re-generated on profile load)
    const [signedUrl] = await gcsFile.getSignedUrl({
      action: "read",
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    const logoUrl = signedUrl;

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
