"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Dialog } from "@base-ui-components/react/dialog";
import {
  LayoutDashboard,
  Plus,
  User,
  Settings,
  LogOut,
  Folder
} from "lucide-react";
import { signOut } from "~/lib/auth-client";
import { Button, Input } from "~/components/ui";
import { useToast } from "~/components/ui/toast";
import { createBoard } from "~/lib/api/boards";
import type { BoardSummary } from "~/server/services/board.service";

interface SidebarProps {
  boards: BoardSummary[];
  userName?: string | null;
  userEmail?: string;
}

export function Sidebar({ boards, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { addToast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardDescription, setNewBoardDescription] = useState("");

  // Extract board ID from pathname if on a board page
  const currentBoardId = pathname.match(/\/dashboard\/boards\/([^/]+)/)?.[1];

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/sign-in");
    } catch (error) {
      addToast("Failed to logout", "error");
    }
  };

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) {
      addToast("Board name is required", "error");
      return;
    }

    setIsCreating(true);
    try {
      const response = await createBoard({
        title: newBoardName.trim(),
        description: newBoardDescription.trim() || undefined,
      });

      addToast("Board created successfully!", "success");
      setCreateDialogOpen(false);
      setNewBoardName("");
      setNewBoardDescription("");

      // Navigate to the new board
      router.push(`/dashboard/boards/${response.board.id}`);
      router.refresh();
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Failed to create board",
        "error"
      );
    } finally {
      setIsCreating(false);
    }
  };

  // Filter active boards
  const activeBoards = boards.filter(board => !board.isArchived);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 w-64 bg-gray-900 text-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <LayoutDashboard className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl font-bold">Kanban Board</h1>
          </Link>
        </div>

        {/* Body - Boards List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            <h2 className="text-xs uppercase text-gray-400 font-semibold mb-2">
              Your Boards
            </h2>

            {activeBoards.map((board) => (
              <Link
                key={board.id}
                href={`/dashboard/boards/${board.id}`}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors
                  ${
                    currentBoardId === board.id
                      ? "bg-gray-800 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }
                `}
              >
                <Folder className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{board.title}</span>
              </Link>
            ))}

            {/* Add new board button */}
            <button
              onClick={() => setCreateDialogOpen(true)}
              className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Board</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-800 p-4 space-y-1">
          <Link
            href="/dashboard/profile"
            className={`
              flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors
              ${
                pathname === "/dashboard/profile"
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }
            `}
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </Link>

          <Link
            href="/dashboard/settings"
            className={`
              flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors
              ${
                pathname === "/dashboard/settings"
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }
            `}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>

          {/* User info */}
          {(userName || userEmail) && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-400 px-3">Signed in as</p>
              <p className="text-sm text-white px-3 truncate font-medium">
                {userName || userEmail}
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Create Board Dialog */}
      <Dialog.Root open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl">
            <Dialog.Title className="text-xl font-semibold text-gray-900">
              Create New Board
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-gray-500">
              Set up a new board for your team to organize tasks and track progress.
            </Dialog.Description>

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="board-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Board Name *
                </label>
                <Input
                  id="board-name"
                  type="text"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  placeholder="e.g., Q1 Product Roadmap"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleCreateBoard();
                    }
                  }}
                />
              </div>

              <div>
                <label htmlFor="board-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  id="board-description"
                  value={newBoardDescription}
                  onChange={(e) => setNewBoardDescription(e.target.value)}
                  rows={3}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of what this board is for..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Dialog.Close className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                Cancel
              </Dialog.Close>
              <Button
                onClick={handleCreateBoard}
                disabled={isCreating || !newBoardName.trim()}
                variant="primary"
              >
                {isCreating ? "Creating..." : "Create Board"}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}