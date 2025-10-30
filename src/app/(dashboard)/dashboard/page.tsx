import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui";
import { getSession } from "~/server/auth/client";
import { listBoardsForUser } from "~/server/services/board.service";
import { LayoutDashboard, Plus, Archive, Activity } from "lucide-react";

export default async function DashboardPage() {
  const session = await getSession();

  const boards = session ? await listBoardsForUser(session.user.id) : [];

  const totalBoards = boards.length;
  const archivedBoards = boards.filter((board) => board.isArchived).length;
  const activeBoards = totalBoards - archivedBoards;

  if (totalBoards === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <LayoutDashboard className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to Kanban Board!
        </h2>
        <p className="text-gray-600 max-w-md mb-8">
          Get started by creating your first board. Use the "Create New Board" button
          in the sidebar to begin organizing your tasks.
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Plus className="w-4 h-4" />
          <span>Click "Create New Board" in the sidebar to get started</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">
          Welcome back, {session?.user.name || "User"}!
        </h2>
        <p className="text-gray-600">
          Here's an overview of your workspace activity.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Activity className="w-5 h-5 text-blue-600" />
            <div>
              <CardTitle>Active Boards</CardTitle>
              <CardDescription>Currently in progress</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeBoards}</p>
            <p className="text-sm text-gray-500">boards active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Archive className="w-5 h-5 text-gray-600" />
            <div>
              <CardTitle>Archived</CardTitle>
              <CardDescription>Completed or paused</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{archivedBoards}</p>
            <p className="text-sm text-gray-500">boards archived</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <LayoutDashboard className="w-5 h-5 text-green-600" />
            <div>
              <CardTitle>Total Boards</CardTitle>
              <CardDescription>All time created</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalBoards}</p>
            <p className="text-sm text-gray-500">boards total</p>
          </CardContent>
        </Card>
      </div>

      {activeBoards > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Jump into your work</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Select a board from the sidebar to view and manage its tasks, or create a new board to start a fresh project.
              </p>
              <div className="flex items-center gap-2 pt-4">
                <Plus className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">
                  Use the "Create New Board" button in the sidebar to add more boards
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Active Boards</CardTitle>
            <CardDescription>All your boards are archived</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              You can unarchive a board from the board's settings page, or create a new one using the sidebar.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates across your boards</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Activity feed coming soon. You'll be able to see recent changes, comments, and updates from your team here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
