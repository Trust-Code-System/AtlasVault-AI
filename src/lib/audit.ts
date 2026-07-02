import { db } from "./db";

export async function logAudit(params: {
  workspaceId: string;
  userId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  detail?: string;
}) {
  try {
    await db.auditLog.create({
      data: {
        workspaceId: params.workspaceId,
        userId: params.userId ?? null,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        detail: params.detail,
      },
    });
  } catch (e) {
    console.error("audit log failed", e);
  }
}

export async function logUsage(params: {
  workspaceId: string;
  userId?: string | null;
  kind: string;
  model?: string;
  detail?: string;
}) {
  try {
    await db.usageLog.create({
      data: {
        workspaceId: params.workspaceId,
        userId: params.userId ?? null,
        kind: params.kind,
        model: params.model,
        detail: params.detail,
      },
    });
  } catch (e) {
    console.error("usage log failed", e);
  }
}
