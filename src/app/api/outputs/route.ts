import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiRole } from "@/lib/api-auth";
import { generateOutput, getTemplate } from "@/lib/outputs";
import { withApi } from "@/lib/errors";
import { rateLimit, LIMITS } from "@/lib/ratelimit";
import { logAudit, logUsage } from "@/lib/audit";
import { aiModelLabel } from "@/lib/ai/client";

export const maxDuration = 180;

const schema = z.object({ template: z.string().min(1).max(60) });

export const POST = withApi(async (req: Request) => {
  const auth = await requireApiRole("generate", "Your role cannot generate outputs");
  if (auth.response) return auth.response;
  const { session } = auth;

  const rl = rateLimit(`gen:${session.userId}`, LIMITS.generate.limit, LIMITS.generate.windowMs);
  if (!rl.ok) return NextResponse.json({ error: `Generation rate limit reached — try again in ${rl.retryAfterSec}s.` }, { status: 429 });

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success || !getTemplate(body.data.template)) {
    return NextResponse.json({ error: "Unknown template" }, { status: 400 });
  }

  const output = await generateOutput(session.workspaceId, body.data.template, session.userId);

  await logAudit({ workspaceId: session.workspaceId, userId: session.userId, action: "output.generated", targetType: "OUTPUT", targetId: output.id, detail: `Generated “${output.title}” from template ${body.data.template}` });
  await logUsage({ workspaceId: session.workspaceId, userId: session.userId, kind: "AI_CALL", model: aiModelLabel(), detail: `output:${body.data.template}` });

  return NextResponse.json({ id: output.id });
}, "OUTPUT_GENERATION");
