import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function unauthorized() {
  return err("Unauthorized", 401);
}

export function notFound(resource = "Resource") {
  return err(`${resource} not found`, 404);
}

export function forbidden() {
  return err("Forbidden", 403);
}

export function badRequest(message: string) {
  return err(message, 400);
}
