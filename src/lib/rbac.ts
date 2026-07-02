// Role-based access control. Roles are ordered; each action has a minimum role.
export type Role = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

const rank: Record<string, number> = { OWNER: 4, ADMIN: 3, MEMBER: 2, VIEWER: 1 };

export type Action =
  | "view"
  | "ask"
  | "upload"
  | "generate"
  | "edit_content"
  | "approve"
  | "export"
  | "manage_team"
  | "delete";

const minRole: Record<Action, number> = {
  view: rank.VIEWER,
  ask: rank.VIEWER,
  upload: rank.MEMBER,
  generate: rank.MEMBER,
  edit_content: rank.MEMBER,
  approve: rank.ADMIN,
  export: rank.MEMBER, // export additionally requires an APPROVED proposal
  manage_team: rank.ADMIN,
  delete: rank.ADMIN,
};

export function can(role: string, action: Action): boolean {
  return (rank[role] ?? 0) >= minRole[action];
}

export const ROLES: Role[] = ["OWNER", "ADMIN", "MEMBER", "VIEWER"];
