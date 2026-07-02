import { db } from "./db";

export type WorkspaceSettings = {
  /** Learn from approved answers & edits (workspace-scoped only) */
  learningEnabled: boolean;
  /** External-facing exports require admin approval */
  exportApprovalRequired: boolean;
  /** Warn when exports appear to contain sensitive data */
  sensitiveWarnings: boolean;
  /** Allow clearly-labeled public web research (roadmap feature flag) */
  webResearchEnabled: boolean;
};

export const DEFAULT_SETTINGS: WorkspaceSettings = {
  learningEnabled: true,
  exportApprovalRequired: true,
  sensitiveWarnings: true,
  webResearchEnabled: false,
};

export async function getWorkspaceSettings(workspaceId: string): Promise<WorkspaceSettings> {
  const ws = await db.workspace.findUnique({ where: { id: workspaceId }, select: { settings: true } });
  if (!ws?.settings) return { ...DEFAULT_SETTINGS };
  try {
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(ws.settings) as Partial<WorkspaceSettings>) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function updateWorkspaceSettings(workspaceId: string, patch: Partial<WorkspaceSettings>): Promise<WorkspaceSettings> {
  const current = await getWorkspaceSettings(workspaceId);
  const next = { ...current, ...patch };
  await db.workspace.update({ where: { id: workspaceId }, data: { settings: JSON.stringify(next) } });
  return next;
}
