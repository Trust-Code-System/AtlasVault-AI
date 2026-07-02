import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { createInviteToken, hashInviteToken, inviteExpiry } from "@/lib/invites";

const inviteSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]),
});

/** Invite a team member with a one-time token. No temporary passwords are created. */
export async function POST(req: Request) {
  const auth = await requireApiRole("manage_team", "Only admins can manage the team");
  if (auth.response) return auth.response;
  const { session } = auth;

  const body = inviteSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { name, email, role } = body.data;

  const normalizedEmail = email.toLowerCase();
  const user = await db.user.findUnique({ where: { email: normalizedEmail } });

  if (user) {
    const existing = await db.membership.findUnique({
      where: { userId_workspaceId: { userId: user.id, workspaceId: session.workspaceId } },
    });
    if (existing) return NextResponse.json({ error: "Already a member of this workspace" }, { status: 409 });
  }

  const pending = await db.teamInvite.findFirst({
    where: { workspaceId: session.workspaceId, email: normalizedEmail, status: "PENDING", expiresAt: { gt: new Date() } },
  });
  if (pending) return NextResponse.json({ error: "A pending invite already exists for this email" }, { status: 409 });

  const token = createInviteToken();
  const invite = await db.teamInvite.create({
    data: {
      workspaceId: session.workspaceId,
      email: normalizedEmail,
      name,
      role,
      tokenHash: hashInviteToken(token),
      expiresAt: inviteExpiry(),
      invitedById: session.userId,
    },
  });
  await logAudit({ workspaceId: session.workspaceId, userId: session.userId, action: "team.member_invited", targetType: "TEAM_INVITE", targetId: invite.id, detail: `${normalizedEmail} invited as ${role}` });

  const origin = new URL(req.url).origin;
  return NextResponse.json({ ok: true, inviteUrl: `${origin}/signup?invite=${token}` });
}

const roleSchema = z.object({
  membershipId: z.string(),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]).optional(),
  remove: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  const auth = await requireApiRole("manage_team", "Only admins can manage the team");
  if (auth.response) return auth.response;
  const { session } = auth;

  const body = roleSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const membership = await db.membership.findFirst({
    where: { id: body.data.membershipId, workspaceId: session.workspaceId },
    include: { user: true },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (membership.role === "OWNER") return NextResponse.json({ error: "The owner's role cannot be changed" }, { status: 400 });

  if (body.data.remove) {
    await db.membership.delete({ where: { id: membership.id } });
    await logAudit({ workspaceId: session.workspaceId, userId: session.userId, action: "team.member_removed", detail: membership.user.email });
    return NextResponse.json({ ok: true });
  }
  if (body.data.role) {
    await db.membership.update({ where: { id: membership.id }, data: { role: body.data.role } });
    await logAudit({ workspaceId: session.workspaceId, userId: session.userId, action: "team.role_changed", detail: `${membership.user.email} → ${body.data.role}` });
  }
  return NextResponse.json({ ok: true });
}
