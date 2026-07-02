import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const INVITE_TTL_DAYS = 7;

export function createInviteToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function inviteExpiry(now = new Date()): Date {
  return new Date(now.getTime() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export function tokensMatch(token: string, hash: string): boolean {
  const incoming = Buffer.from(hashInviteToken(token), "hex");
  const stored = Buffer.from(hash, "hex");
  return incoming.length === stored.length && timingSafeEqual(incoming, stored);
}
