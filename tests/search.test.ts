import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    documentChunk: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

describe("workspace retrieval filters", () => {
  beforeEach(() => vi.clearAllMocks());

  it("always scopes chunk search to the caller workspace", async () => {
    const { searchChunks } = await import("@/lib/search");
    const { db } = await import("@/lib/db");

    await searchChunks("workspace-a", "school portal", { topK: 3 });

    expect(db.documentChunk.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          document: expect.objectContaining({ workspaceId: "workspace-a" }),
        }),
      })
    );
  });

  it("excludes confidential documents when requested for viewer access", async () => {
    const { searchChunks } = await import("@/lib/search");
    const { db } = await import("@/lib/db");

    await searchChunks("workspace-a", "school portal", { includeConfidential: false });

    expect(db.documentChunk.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          document: expect.objectContaining({ confidential: false }),
        }),
      })
    );
  });
});
