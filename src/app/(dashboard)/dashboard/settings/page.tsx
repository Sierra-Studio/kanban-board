import { redirect } from "next/navigation";
import { getSession } from "~/server/auth/client";
import { listBoardsForUser } from "~/server/services/board.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui";
import { Users, Shield, Archive, Activity } from "lucide-react";

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
        <CardHeader className="flex flex-row items-center gap-3">
          <Users className="w-5 h-5 text-green-600" />
          <div>
            <CardTitle>Board Members Management</CardTitle>
            <CardDescription>
              Invite team members and manage access to your boards
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {boards.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-4">
                  Select a board to manage its members:
                </p>
                {activeBoards.map(board => (
                  <div key={board.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-sm">{board.title}</p>
                      <p className="text-xs text-gray-500">
                        {board.memberCount} member{board.memberCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400">
                      Member management coming soon
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No boards available. Create a board first to manage members.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <Shield className="w-5 h-5 text-purple-600" />
          <div>
            <CardTitle>Role Permissions</CardTitle>
            <CardDescription>
              Understand what each role can do in your boards
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-sm mb-2">Owner</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Full access to all board features</li>
                <li>• Can delete the board</li>
                <li>• Can manage all members and their roles</li>
              </ul>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-sm mb-2">Admin</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Can edit board settings</li>
                <li>• Can add/remove members</li>
                <li>• Can manage cards and columns</li>
              </ul>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-sm mb-2">Member</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Can create, edit, and move cards</li>
                <li>• Can comment on cards</li>
                <li>• Cannot change board settings</li>
              </ul>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-sm mb-2">Viewer</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Read-only access</li>
                <li>• Can view boards and cards</li>
                <li>• Cannot make any changes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

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