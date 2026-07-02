import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const [workspace, user] = await Promise.all([
    db.workspace.findUnique({ where: { id: session.workspaceId } }),
    db.user.findUnique({ where: { id: session.userId }, select: { isPlatformAdmin: true } }),
  ]);

  return (
    <div className="min-h-screen">
      <Sidebar
        workspaceName={workspace?.name ?? "Workspace"}
        userName={session.name}
        role={session.role}
        isPlatformAdmin={user?.isPlatformAdmin}
      />
      <main className="min-h-screen px-4 pb-8 pt-16 sm:px-8 lg:ml-60 lg:pt-7">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
