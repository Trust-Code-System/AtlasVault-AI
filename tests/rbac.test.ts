import { describe, expect, it } from "vitest";
import { can } from "@/lib/rbac";

describe("RBAC policy", () => {
  it("keeps viewers read-only except asking questions", () => {
    expect(can("VIEWER", "view")).toBe(true);
    expect(can("VIEWER", "ask")).toBe(true);
    expect(can("VIEWER", "upload")).toBe(false);
    expect(can("VIEWER", "generate")).toBe(false);
    expect(can("VIEWER", "export")).toBe(false);
  });

  it("requires admins for approval, team management, and deletion", () => {
    expect(can("MEMBER", "approve")).toBe(false);
    expect(can("MEMBER", "manage_team")).toBe(false);
    expect(can("MEMBER", "delete")).toBe(false);
    expect(can("ADMIN", "approve")).toBe(true);
    expect(can("ADMIN", "manage_team")).toBe(true);
    expect(can("ADMIN", "delete")).toBe(true);
  });
});
