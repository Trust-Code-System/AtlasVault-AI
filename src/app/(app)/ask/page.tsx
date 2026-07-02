import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { AskClient } from "./ask-client";
import { aiModelLabel } from "@/lib/ai/client";

export default async function AskPage() {
  const session = await requireSession();
  const recent = await db.answer.findMany({
    where: { workspaceId: session.workspaceId },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  return (
    <>
      <PageHeader
        title="Ask AI"
        subtitle={`Ask anything about your company knowledge. Answers are grounded in your uploaded documents with citations — if the evidence isn't there, AtlasVault says so. Engine: ${aiModelLabel()}.`}
      />
      <AskClient recentQuestions={recent.map((r) => r.question)} />
    </>
  );
}
