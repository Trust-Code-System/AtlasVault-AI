import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const apiRoot = path.join(root, "src", "app", "api");

function routeFiles(dir = apiRoot): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return routeFiles(full);
    return entry.name === "route.ts" ? [full] : [];
  });
}

function read(file: string): string {
  return fs.readFileSync(file, "utf8");
}

function rel(file: string): string {
  return path.relative(root, file).replaceAll(path.sep, "/");
}

const protectedRoutes = routeFiles().filter((file) => !rel(file).startsWith("src/app/api/auth/") && rel(file) !== "src/app/api/errors/route.ts");

describe("API authorization contract", () => {
  it("routes use the centralized API guard instead of direct apiSession calls", () => {
    for (const file of protectedRoutes) {
      const source = read(file);
      expect(source, rel(file)).toMatch(/requireApi(Session|Role)/);
      expect(source, rel(file)).not.toMatch(/\bapiSession\b/);
    }
  });

  it("workspace-owned reads and writes are scoped by workspaceId", () => {
    const scopedRoutes = protectedRoutes.filter((file) => !rel(file).includes("/team/"));
    for (const file of scopedRoutes) {
      expect(read(file), rel(file)).toContain("workspaceId");
    }
  });
});

describe("privacy and export contracts", () => {
  it("Ask AI excludes confidential documents for viewers", () => {
    const source = read(path.join(apiRoot, "ask", "route.ts"));
    expect(source).toContain('session.role !== "VIEWER"');
    expect(source).toContain("includeConfidential");
  });

  it("proposal export is approval-gated", () => {
    const source = read(path.join(apiRoot, "proposals", "[id]", "export", "route.ts"));
    expect(source).toContain('status !== "APPROVED"');
    expect(source).toContain('status !== "EXPORTED"');
    expect(source).toContain('can(session.role, "approve")');
  });

  it("platform org admin page avoids private document and proposal content", () => {
    const source = read(path.join(root, "src", "app", "admin", "organizations", "page.tsx"));
    expect(source).toContain("_count");
    expect(source).not.toContain("extractedText");
    expect(source).not.toContain("content: true");
    expect(source).not.toContain("summary: true");
  });

  it("team invites do not return temporary passwords", () => {
    const source = read(path.join(apiRoot, "team", "route.ts"));
    expect(source).toContain("teamInvite.create");
    expect(source).toContain("inviteUrl");
    expect(source).not.toContain("tempPassword");
  });
});
