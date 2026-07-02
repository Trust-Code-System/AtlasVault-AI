import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { hashInviteToken } from "@/lib/invites";
import { slugify } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  company: z.string().max(160).optional(),
  industry: z.string().max(120).optional(),
  country: z.string().max(120).optional(),
  inviteToken: z.string().min(20).max(200).optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { name, email, password, company, industry, country, inviteToken } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  if (!inviteToken && !company?.trim()) {
    return NextResponse.json({ error: "Company name is required" }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });

  const passwordHash = await hashPassword(password);

  const result = await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name, email: normalizedEmail, passwordHash },
    });

    if (inviteToken) {
      const invite = await tx.teamInvite.findUnique({
        where: { tokenHash: hashInviteToken(inviteToken) },
      });
      if (!invite || invite.status !== "PENDING" || invite.expiresAt <= new Date()) {
        throw new SignupError("Invite link is invalid or expired", 400);
      }
      if (invite.email !== normalizedEmail) {
        throw new SignupError("This invite was issued for a different email address", 403);
      }

      await tx.membership.create({
        data: { userId: user.id, workspaceId: invite.workspaceId, role: invite.role },
      });
      await tx.teamInvite.update({
        where: { id: invite.id },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
      });
      await tx.auditLog.create({
        data: { workspaceId: invite.workspaceId, userId: user.id, action: "team.invite_accepted", targetType: "TEAM_INVITE", targetId: invite.id, detail: `${normalizedEmail} joined as ${invite.role}` },
      });
      return { user, workspaceId: invite.workspaceId, role: invite.role };
    }

    const org = await tx.organization.create({ data: { name: company!.trim(), industry, country } });
    let slug = slugify(company!.trim()) || "workspace";
    if (await tx.workspace.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
    const workspace = await tx.workspace.create({ data: { name: company!.trim(), slug, orgId: org.id } });
    await tx.membership.create({ data: { userId: user.id, workspaceId: workspace.id, role: "OWNER" } });
    await tx.auditLog.create({ data: { workspaceId: workspace.id, userId: user.id, action: "workspace.created", detail: `Workspace ${company!.trim()} created by ${normalizedEmail}` } });
    return { user, workspaceId: workspace.id, role: "OWNER" };
  }).catch((error) => {
    if (error instanceof SignupError) return error;
    throw error;
  });

  if (result instanceof SignupError) {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }

  await createSession({ userId: result.user.id, workspaceId: result.workspaceId, role: result.role, name, email: normalizedEmail });
  return NextResponse.json({ ok: true });
}

class SignupError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}
