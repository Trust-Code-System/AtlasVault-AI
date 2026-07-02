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
    <div className="spatial-shell min-h-screen overflow-x-hidden bg-[#050506] text-slate-100">
      <Sidebar
        workspaceName={workspace?.name ?? "Workspace"}
        userName={session.name}
        role={session.role}
        isPlatformAdmin={user?.isPlatformAdmin}
      />
      <main className="relative z-10 min-h-screen px-4 pb-12 pt-24 sm:px-8 lg:ml-28 lg:pt-32">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
