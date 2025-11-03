import { redirect } from "next/navigation";

import { getSession } from "~/server/auth/client";
import { getBoardDetail } from "~/server/services/board.service";

import { BoardColumnsManager } from "../components/board-columns";

type BoardPageProps = {
  boardId: string;
};

export default async function BoardDetailPage({
  params,
}: {
  params: Promise<BoardPageProps>;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }
  const { boardId } = await params;

  const detail = await getBoardDetail(boardId, session.user.id);

  const columns = detail.columns.map((column) => ({
    ...column,
    createdAt: column.createdAt.toISOString(),
    updatedAt: column.updatedAt.toISOString(),
    cards: column.cards.map((card) => ({
      ...card,
      createdAt: card.createdAt.toISOString(),
      updatedAt: card.updatedAt.toISOString(),
    })),
  }));

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {detail.board.title}
          </h1>
          {detail.board.description ? (
            <p className="mt-1 text-gray-600">{detail.board.description}</p>
          ) : null}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <BoardColumnsManager
          boardId={detail.board.id}
          initialColumns={columns}
        />
      </div>
    </div>
  );
}
