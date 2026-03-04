import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  // Strip sslmode from the URL before passing to pg — pg-connection-string v2
  // treats 'sslmode=require' as verify-full, overriding the ssl pool option.
  // We handle SSL explicitly via the pool config instead.
  const url = new URL(connectionString);
  url.searchParams.delete("sslmode");

  const isProduction = process.env.NODE_ENV === "production";
  const isLocalhost =
    url.hostname === "localhost" || url.hostname === "127.0.0.1";

  // Locally, skip SSL entirely since the connection is loopback.
  // For remote hosts, enable SSL but don't verify the certificate — most
  // managed providers (Neon, Supabase, Railway) use shared certs that
  // fail strict CA verification. Set DB_SSL_REJECT_UNAUTHORIZED=true to
  // enforce strict verification if your provider supports it.
  const strictSSL = process.env.DB_SSL_REJECT_UNAUTHORIZED === "true";
  const ssl = isLocalhost
    ? false
    : { rejectUnauthorized: strictSSL };

  const adapter = new PrismaPg({
    connectionString: url.toString(),
    ...(ssl !== false ? { ssl } : {}),
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
