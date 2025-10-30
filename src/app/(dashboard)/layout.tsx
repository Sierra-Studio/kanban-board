import { redirect } from "next/navigation";
import { getSession } from "~/server/auth/client";
import { listBoardsForUser } from "~/server/services/board.service";
import { Sidebar } from "~/components/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  // Fetch boards for the sidebar
  const boards = await listBoardsForUser(session.user.id);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        boards={boards}
        userName={session.user.name}
        userEmail={session.user.email}
      />

      {/* Main content area with left margin to account for sidebar */}
      <main className="flex-1 ml-64 h-full overflow-hidden">
        <div className="h-full px-3 py-4">
          {children}
        </div>
      </main>
    </div>
  );
}