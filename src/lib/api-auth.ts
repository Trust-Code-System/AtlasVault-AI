import { NextResponse } from "next/server";
import { apiSession, type Session } from "./auth";
import { can, type Action } from "./rbac";

export type ApiAuthFailure = { response: NextResponse; session?: never };
export type ApiAuthSuccess = { session: Session; response?: never };
export type ApiAuthResult = ApiAuthSuccess | ApiAuthFailure;

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export async function requireApiSession(): Promise<ApiAuthResult> {
  const session = await apiSession();
  if (!session) return { response: jsonError("Unauthorized", 401) };
  return { session };
}

export async function requireApiRole(action: Action, forbiddenMessage = "Forbidden"): Promise<ApiAuthResult> {
  const auth = await requireApiSession();
  if (auth.response) return auth;
  if (!can(auth.session.role, action)) return { response: jsonError(forbiddenMessage, 403) };
  return auth;
}

export function scopedWorkspace(session: Session): { workspaceId: string } {
  return { workspaceId: session.workspaceId };
}

export function sameWorkspace(session: Session, workspaceId: string | null | undefined): boolean {
  return Boolean(workspaceId && workspaceId === session.workspaceId);
}
