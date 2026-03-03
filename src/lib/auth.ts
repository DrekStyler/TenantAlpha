import { auth } from "@clerk/nextjs/server";

export function getAuthUserId(): string {
  const { userId } = auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}
