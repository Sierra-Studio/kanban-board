import { redirect } from "next/navigation";
import { getSession } from "~/server/auth/client";
import { listBoardsForUser } from "~/server/services/board.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui";
import { Archive, Activity } from "lucide-react";

export default async function SettingsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  // Fetch user's boards to show board-specific settings
  const boards = await listBoardsForUser(session.user.id);
  const activeBoards = boards.filter(b => !b.isArchived);
  const archivedBoards = boards.filter(b => b.isArchived);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Configure your workspace and manage board settings</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Activity className="w-5 h-5 text-blue-600" />
            <div>
              <CardTitle>Active Boards</CardTitle>
              <CardDescription>Currently active boards</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeBoards.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Archive className="w-5 h-5 text-gray-600" />
            <div>
              <CardTitle>Archived Boards</CardTitle>
              <CardDescription>Inactive boards</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{archivedBoards.length}</p>
          </CardContent>
        </Card>
      </div>



      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>
            Customize your dashboard experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Preference settings coming soon. You'll be able to customize themes, notifications, and display options here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}