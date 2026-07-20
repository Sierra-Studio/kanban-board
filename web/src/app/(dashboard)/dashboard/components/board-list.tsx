"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "~/components/ui";
import { useToast } from "~/components/ui/toast";
import { archiveBoard, duplicateBoard } from "~/lib/api/boards";

export type BoardListItem = {
  id: string;
  title: string;
  description: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  columnCount: number;
};

type ViewMode = "grid" | "list";

type BoardListProps = {
  boards: BoardListItem[];
};

export function BoardList({ boards }: BoardListProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<BoardListItem[]>(boards);

  useEffect(() => {
    setItems(boards);
  }, [boards]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return items;

    return items.filter((board) => {
      return (
        board.title.toLowerCase().includes(normalizedQuery) ||
        (board.description ?? "").toLowerCase().includes(normalizedQuery)
      );
    });
  }, [items, query]);

  const handleArchiveToggle = async (board: BoardListItem) => {
    try {
      const updated = await archiveBoard(board.id, !board.isArchived);
      setItems((prev) =>
        prev.map((item) =>
          item.id === board.id
            ? {
                ...item,
                isArchived: updated.isArchived,
                updatedAt: updated.updatedAt,
              }
            : item,
        ),
      );
      addToast(
        updated.isArchived ? "Board archived" : "Board restored",
        "success",
      );
      router.refresh();
    } catch (error) {
      console.error("Archive board error", error);
      addToast(
        error instanceof Error ? error.message : "Failed to update board",
        "error",
      );
    }
  };

  const handleDuplicate = async (board: BoardListItem) => {
    try {
      const result = await duplicateBoard(board.id);
      const nextBoard = {
        ...result.board,
        createdAt: result.board.createdAt,
        updatedAt: result.board.updatedAt,
      };
      setItems((prev) => [nextBoard, ...prev]);
      addToast("Board duplicated", "success");
      router.refresh();
    } catch (error) {
      console.error("Duplicate board error", error);
      addToast(
        error instanceof Error ? error.message : "Failed to duplicate board",
        "error",
      );
    }
  };

  const handleViewChange = (mode: ViewMode) => setViewMode(mode);


  const renderBoardCard = (board: BoardListItem) => (
    <li
      key={board.id}
      className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {board.title}
            {board.isArchived ? (
              <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                Archived
              </span>
            ) : null}
          </h3>
          <p className="mt-2 max-h-12 overflow-hidden text-sm text-gray-600">
            {board.description ?? "No description"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleArchiveToggle(board)}
          >
            {board.isArchived ? "Restore" : "Archive"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleDuplicate(board)}>
            Duplicate
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
        <span>Columns: {board.columnCount}</span>
        <span>
          Updated: {new Date(board.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <Link
          href={`/dashboard/boards/${board.id}`}
          className="text-blue-600 hover:underline"
        >
          Open board
        </Link>
      </div>
    </li>
  );

  const renderBoardRow = (board: BoardListItem) => (
    <tr key={board.id} className="border-b last:border-b-0">
      <td className="px-4 py-3">
        <div className="font-medium text-gray-900">{board.title}</div>
        <div className="text-sm text-gray-500">{board.description ?? "No description"}</div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">{board.columnCount}</td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {new Date(board.updatedAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => handleDuplicate(board)}>
            Duplicate
          </Button>
          <Button size="sm" variant="secondary" onClick={() => handleArchiveToggle(board)}>
            {board.isArchived ? "Restore" : "Archive"}
          </Button>
          <Link href={`/dashboard/boards/${board.id}`} className="text-sm text-blue-600 hover:underline">
            Open
          </Link>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search boards"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "primary" : "secondary"}
            size="sm"
            onClick={() => handleViewChange("grid")}
          >
            Grid view
          </Button>
          <Button
            variant={viewMode === "list" ? "primary" : "secondary"}
            size="sm"
            onClick={() => handleViewChange("list")}
          >
            List view
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-24 text-center">
          <p className="text-lg font-medium text-gray-900">No boards yet</p>
          <p className="mt-2 max-w-sm text-sm text-gray-600">
            Create a new board to get started. Boards help you organize work across columns and keep teammates in sync.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((board) => renderBoardCard(board))}
        </ul>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Board
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Columns
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Updated
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filtered.map((board) => renderBoardRow(board))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
