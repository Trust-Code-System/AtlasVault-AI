import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sanitizeMessage } from "@/lib/errors";
import { rateLimit } from "@/lib/ratelimit";

const schema = z.object({
  ref: z.string().max(40),
  message: z.string().max(400),
  digest: z.string().max(120).optional(),
  route: z.string().max(300).optional(),
});

/** Client-side error reports (from the error boundary). Sanitized; rate-limited. */
export async function POST(req: Request) {
  const rl = rateLimit("client-errors", 60, 60_000);
  if (!rl.ok) return NextResponse.json({ ok: true }); // silently drop floods

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ ok: true });

  const session = await getSession().catch(() => null);
  try {
    await db.errorLog.create({
      data: {
        ref: body.data.ref.replace(/[^A-Z0-9-]/gi, "").slice(0, 24) || `ERR-${Date.now()}`,
        severity: "ERROR",
        category: "CLIENT",
        message: sanitizeMessage(body.data.message),
        route: body.data.route?.slice(0, 200),
        statusCode: 0,
        workspaceId: session?.workspaceId ?? null,
        userId: session?.userId ?? null,
        meta: body.data.digest ? JSON.stringify({ digest: body.data.digest }) : null,
      },
    });
  } catch {
    // duplicate ref or db issue — never surface to the user
  }
  return NextResponse.json({ ok: true });
}
