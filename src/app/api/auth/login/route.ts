import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { rateLimit, LIMITS } from "@/lib/ratelimit";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const rl = rateLimit(`login:${parsed.data.email.toLowerCase()}`, LIMITS.auth.limit, LIMITS.auth.windowMs);
  if (!rl.ok) return NextResponse.json({ error: `Too many attempts — try again in ${rl.retryAfterSec}s.` }, { status: 429 });

  const user = await db.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    include: { memberships: { include: { workspace: true }, orderBy: { createdAt: "asc" } } },
  });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
  const membership = user.memberships[0];
  if (!membership) return NextResponse.json({ error: "No workspace membership found" }, { status: 403 });

  await createSession({
    userId: user.id,
    workspaceId: membership.workspaceId,
    role: membership.role,
    name: user.name,
    email: user.email,
  });
  await logAudit({ workspaceId: membership.workspaceId, userId: user.id, action: "user.signed_in", detail: user.email });
  return NextResponse.json({ ok: true });
}
