import { useState, type DragEvent } from "react";
import { moveCardRequest } from "~/lib/api/cards";
import type { CardResponse } from "~/lib/api/cards";

type ColumnState = {
  id: string;
  boardId: string;
  name: string;
  position: number;
  isCollapsed: boolean;
  cardCount: number;
  createdAt: string;
  updatedAt: string;
  cards: CardResponse[];
};

type DragState =
  | { type: "column"; columnId: string }
  | { type: "card"; cardId: string; sourceColumnId: string }
  | null;

type DropIndicator = {
  columnId: string;
  index: number;
} | null;

export function useBoardDragDrop(
  columns: ColumnState[],
  setColumns: React.Dispatch<React.SetStateAction<ColumnState[]>>,
  canEdit: boolean,
  onSuccess: (message: string) => void,
  onError: (message: string) => void,
) {
  const [dragState, setDragState] = useState<DragState>(null);
  const [dropIndicator, setDropIndicator] = useState<DropIndicator>(null);

  // Card drag handlers
  const handleCardDragStart = (
    columnId: string,
    card: CardResponse,
    event: DragEvent<HTMLDivElement>,
  ) => {
    if (!canEdit) return;
    event.stopPropagation();
    setDragState({ type: "card", cardId: card.id, sourceColumnId: columnId });
    setDropIndicator(null);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", card.id);
  };

  const handleCardDragOver = (
    columnId: string,
    cardIndex: number,
    event: DragEvent<HTMLDivElement>,
  ) => {
    if (!canEdit || dragState?.type !== "card") return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";

    // Calculate if we should show indicator above or below based on mouse position
    const rect = event.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const mouseY = event.clientY;

    // If mouse is in top half, show indicator above (insert before this card)
    // If mouse is in bottom half, show indicator below (insert after this card)
    const insertIndex = mouseY < midpoint ? cardIndex : cardIndex + 1;

    setDropIndicator({ columnId, index: insertIndex });
  };

  const handleCardDrop = (event: DragEvent<HTMLDivElement>) => {
    if (!canEdit || dragState?.type !== "card" || !dropIndicator) return;
    event.preventDefault();
    event.stopPropagation();

    const { cardId, sourceColumnId } = dragState;
    const { columnId: targetColumnId, index: targetIndex } = dropIndicator;

    if (!cardId) {
      setDragState(null);
      return;
    }

    const sourceColumn = columns.find((column) => column.id === sourceColumnId);
    const targetColumn = columns.find((column) => column.id === targetColumnId);
    if (!sourceColumn || !targetColumn) {
      setDragState(null);
      return;
    }

    const cardIndex = sourceColumn.cards.findIndex((card) => card.id === cardId);
    if (cardIndex === -1) {
      setDragState(null);
      return;
    }

    const card = sourceColumn.cards[cardIndex]!;
    const nextColumns = columns.map((column) => ({ ...column, cards: [...column.cards] }));

    const source = nextColumns.find((column) => column.id === sourceColumnId)!;
    const target = nextColumns.find((column) => column.id === targetColumnId)!;

    source.cards.splice(cardIndex, 1);
    const clampedIndex = Math.max(0, Math.min(targetIndex, target.cards.length));
    target.cards.splice(clampedIndex, 0, {
      ...card,
      columnId: targetColumnId,
    });
    source.cardCount = source.cards.length;
    target.cardCount = target.cards.length;

    setColumns(nextColumns);

    moveCardRequest(cardId, {
      toColumnId: targetColumnId,
      index: clampedIndex,
    })
      .then((updatedCard) => {
        setColumns((prev) =>
          prev.map((column) =>
            column.id === targetColumnId
              ? {
                  ...column,
                  cards: column.cards.map((item) => (item.id === updatedCard.id ? updatedCard : item)),
                }
              : column,
          ),
        );
        onSuccess("Card moved");
      })
      .catch((error) => {
        console.error("Move card error", error);
        onError(error instanceof Error ? error.message : "Failed to move card");
        setColumns(columns);
      })
      .finally(() => {
        setDragState(null);
        setDropIndicator(null);
      });
  };

  const handleColumnDragOver = (columnId: string, event: DragEvent<HTMLDivElement>) => {
    if (!canEdit || dragState?.type !== "card") return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    // For empty space in column, drop at the end
    const column = columns.find((col) => col.id === columnId);
    if (column) {
      setDropIndicator({ columnId, index: column.cards.length });
    }
  };

  return {
    dragState,
    dropIndicator,
    handleCardDragStart,
    handleCardDragOver,
    handleCardDrop,
    handleColumnDragOver,
  };
}
