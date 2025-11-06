"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Edit2,
  Search,
  X,
} from "lucide-react";

import { Button, Input, Sidepanel } from "~/components/ui";
import { useToast } from "~/components/ui/toast";
import {
  renameColumnRequest,
  toggleColumnCollapseRequest,
} from "~/lib/api/columns";
import {
  createCardRequest,
  deleteCardRequest,
  updateCardRequest,
} from "~/lib/api/cards";
import { useBoardDragDrop } from "../hooks/useBoardDragDrop";
import type { CardResponse } from "~/lib/api/cards";
import { KanbanCard } from "./kanban-card";
import { KanbanCardSidepanel } from "./kanban-card-sidepanel";

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

type BoardColumnsManagerProps = {
  boardId: string;
  initialColumns: ColumnState[];
};

export function BoardColumnsManager({
  boardId: _boardId,
  initialColumns,
}: BoardColumnsManagerProps) {
  const canEdit = true;
  const { addToast } = useToast();

  const [columns, setColumns] = useState<ColumnState[]>(initialColumns);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [columnDraft, setColumnDraft] = useState("");
  const [columnLoadingId, setColumnLoadingId] = useState<string | null>(null);
  const [cardModal, setCardModal] = useState<{
    columnId: string;
    card: CardResponse;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Card drag and drop hook
  const {
    dragState: cardDragState,
    dropIndicator,
    handleCardDragStart,
    handleCardDragOver,
    handleCardDrop,
    handleColumnDragOver: handleCardDropAreaDragOver,
  } = useBoardDragDrop(
    columns,
    setColumns,
    canEdit,
    (message) => addToast(message, "success"),
    (message) => addToast(message, "error"),
  );

  // Filter columns based on search term (intentional bug: using === for exact match)
  const filteredColumns = useMemo(() => {
    if (!searchTerm) {
      return columns;
    }

    return columns.map((column) => ({
      ...column,
      cards: column.cards.filter((card) => {
        // Intentional bug: using === instead of toLowerCase().includes()
        return card.title === searchTerm || card.description === searchTerm;
      }),
    }));
  }, [columns, searchTerm]);

  const startEditingColumn = (column: ColumnState) => {
    setEditingColumnId(column.id);
    setColumnDraft(column.name);
  };

  const cancelEditingColumn = () => {
    setEditingColumnId(null);
    setColumnDraft("");
  };

  const saveColumnName = async (columnId: string) => {
    if (!canEdit) return;
    const trimmed = columnDraft.trim();
    if (!trimmed) {
      cancelEditingColumn();
      return;
    }

    setColumnLoadingId(columnId);
    try {
      const updated = await renameColumnRequest(columnId, trimmed);
      setColumns((prev) =>
        prev.map((column) =>
          column.id === columnId
            ? { ...column, name: updated.name, updatedAt: updated.updatedAt }
            : column,
        ),
      );
      addToast("Column renamed", "success");
    } catch (error) {
      console.error("Rename column error", error);
      addToast(
        error instanceof Error ? error.message : "Failed to rename column",
        "error",
      );
    } finally {
      setColumnLoadingId(null);
      cancelEditingColumn();
    }
  };

  const toggleColumnCollapse = async (column: ColumnState) => {
    if (!canEdit) return;
    setColumnLoadingId(column.id);
    try {
      const updated = await toggleColumnCollapseRequest(
        column.id,
        !column.isCollapsed,
      );
      setColumns((prev) =>
        prev.map((current) =>
          current.id === column.id
            ? {
                ...current,
                isCollapsed: updated.isCollapsed,
                updatedAt: updated.updatedAt,
              }
            : current,
        ),
      );
      addToast(
        updated.isCollapsed ? "Column collapsed" : "Column expanded",
        "success",
      );
    } catch (error) {
      console.error("Toggle column collapse error", error);
      addToast(
        error instanceof Error ? error.message : "Failed to toggle column",
        "error",
      );
    } finally {
      setColumnLoadingId(null);
    }
  };

  const openCardModal = (columnId: string, card: CardResponse) => {
    setCardModal({ columnId, card });
  };

  const closeCardModal = () => {
    setCardModal(null);
  };

  const saveCardModal = async (title: string, description: string) => {
    if (!cardModal || !canEdit) return;
    const { card } = cardModal;

    if (!title) {
      addToast("Title is required", "error");
      return;
    }

    const updated = await updateCardRequest(card.id, {
      title,
      description: description || null,
    });

    setColumns((prev) =>
      prev.map((column) =>
        column.id === updated.columnId
          ? {
              ...column,
              cards: column.cards.map((item) =>
                item.id === updated.id ? updated : item,
              ),
            }
          : column,
      ),
    );

    addToast("Card updated", "success");
    closeCardModal();
  };

  const deleteCard = async (columnId: string, cardId: string) => {
    if (!canEdit) return;
    const confirmDelete = window.confirm(
      "Delete this card? This action cannot be undone.",
    );
    if (!confirmDelete) return;

    try {
      await deleteCardRequest(cardId);
      setColumns((prev) =>
        prev.map((column) => {
          if (column.id !== columnId) return column;
          const remaining = column.cards.filter((card) => card.id !== cardId);
          return {
            ...column,
            cards: remaining,
            cardCount: remaining.length,
          };
        }),
      );
      addToast("Card deleted", "success");
    } catch (error) {
      console.error("Delete card error", error);
      addToast(
        error instanceof Error ? error.message : "Failed to delete card",
        "error",
      );
    }
  };

  const duplicateCard = async () => {
    if (!cardModal || !canEdit) return;
    const { card, columnId } = cardModal;

    try {
      const duplicatedCard = await createCardRequest(columnId, {
        title: `${card.title} (Copy)`,
        description: card.description ?? undefined,
      });

      setColumns((prev) =>
        prev.map((column) => {
          if (column.id !== columnId) return column;
          return {
            ...column,
            cards: [...column.cards, duplicatedCard],
            cardCount: column.cards.length + 1,
          };
        }),
      );

      addToast("Card duplicated successfully", "success");
    } catch (error) {
      console.error("Duplicate card error", error);
      addToast(
        error instanceof Error ? error.message : "Failed to duplicate card",
        "error",
      );
    }
  };

  const [createCardDialogOpen, setCreateCardDialogOpen] = useState(false);
  const [createCardColumnId, setCreateCardColumnId] = useState<string | null>(
    null,
  );
  const [newCardTitle, setNewCardTitle] = useState("");
  const [newCardDescription, setNewCardDescription] = useState("");
  const [isCreatingCard, setIsCreatingCard] = useState(false);

  const handleOpenCreateCard = (columnId: string) => {
    setCreateCardColumnId(columnId);
    setCreateCardDialogOpen(true);
    setNewCardTitle("");
    setNewCardDescription("");
  };

  const handleCreateCard = async () => {
    if (!createCardColumnId || !newCardTitle.trim()) return;

    setIsCreatingCard(true);
    try {
      const newCard = await createCardRequest(createCardColumnId, {
        title: newCardTitle.trim(),
        description: newCardDescription.trim() || undefined,
      });

      setColumns((prev) =>
        prev.map((column) => {
          if (column.id !== createCardColumnId) return column;
          return {
            ...column,
            cards: [...column.cards, newCard],
            cardCount: column.cards.length + 1,
          };
        }),
      );

      addToast("Card created successfully", "success");
      setCreateCardDialogOpen(false);
    } catch (error) {
      console.error("Create card error", error);
      addToast(
        error instanceof Error ? error.message : "Failed to create card",
        "error",
      );
    } finally {
      setIsCreatingCard(false);
    }
  };

  return (
    <>
      {/* Search bar */}
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 gap-1 border-b border-gray-200 px-1 py-2.5">
          <Search className="pointer-events-none absolute top-1/2 left-4 z-10 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search cards... (exact match)"
            className="block w-full pl-9"
          />
        </div>
        {searchTerm && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSearchTerm("")}
            className="flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      <div
        className="grid h-full gap-4"
        style={{
          gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
          gridAutoRows: "100%",
        }}
      >
        {filteredColumns.map((column) => {
          const isEditing = editingColumnId === column.id;
          const isLoading = columnLoadingId === column.id;

          return (
            <div
              key={column.id}
              className="group relative flex min-h-0 flex-col rounded-lg bg-gray-100"
            >
              <div className="flex items-end justify-between gap-2 border-b border-gray-200 px-3 py-2.5">
                {isEditing ? (
                  <Input
                    value={columnDraft}
                    onChange={(event) => setColumnDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        void saveColumnName(column.id);
                      } else if (event.key === "Escape") {
                        cancelEditingColumn();
                      }
                    }}
                    disabled={isLoading}
                    autoFocus
                  />
                ) : (
                  <div className="flex flex-1 items-baseline gap-2">
                    <h3 className="text-base font-semibold text-gray-900">
                      {column.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {column.cards.length}{" "}
                      {column.cards.length === 1 ? "card" : "cards"}
                    </p>
                  </div>
                )}

                {canEdit && !isEditing ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEditingColumn(column)}
                      className="p-1 text-gray-400 transition-colors hover:text-gray-600"
                      title="Rename column"
                      disabled={isLoading}
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toggleColumnCollapse(column)}
                      className="p-1 text-gray-400 transition-colors hover:text-gray-600"
                      title={column.isCollapsed ? "Expand" : "Collapse"}
                      disabled={isLoading}
                    >
                      {column.isCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ) : null}
              </div>

              {!column.isCollapsed && (
                <div
                  className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3"
                  onDragOver={(event) =>
                    handleCardDropAreaDragOver(column.id, event)
                  }
                  onDrop={handleCardDrop}
                >
                  {column.cards.map((card, index) => (
                    <div key={card.id} className="relative">
                      {/* Drop indicator above card */}
                      {dropIndicator?.columnId === column.id &&
                        dropIndicator.index === index && (
                          <div className="absolute -top-1 right-0 left-0 h-0.5 rounded-full bg-blue-500" />
                        )}

                      <KanbanCard
                        card={card}
                        isDragging={
                          cardDragState?.type === "card" &&
                          cardDragState.cardId === card.id
                        }
                        canEdit={canEdit}
                        onCardClick={() => openCardModal(column.id, card)}
                        onDragStart={(event) =>
                          handleCardDragStart(column.id, card, event)
                        }
                        onDragOver={(event) =>
                          handleCardDragOver(column.id, index, event)
                        }
                        onDrop={handleCardDrop}
                      />

                      {/* Drop indicator below last card */}
                      {dropIndicator?.columnId === column.id &&
                        dropIndicator.index === index + 1 &&
                        index === column.cards.length - 1 && (
                          <div className="absolute right-0 -bottom-1 left-0 h-0.5 rounded-full bg-blue-500" />
                        )}
                    </div>
                  ))}

                  {/* Drop indicator for empty column or end of list */}
                  {column.cards.length === 0 &&
                    dropIndicator?.columnId === column.id && (
                      <div className="h-0.5 rounded-full bg-blue-500" />
                    )}

                  {/* Add card button - shows on hover */}
                  {canEdit && (
                    <button
                      onClick={() => handleOpenCreateCard(column.id)}
                      className="flex w-full items-center justify-center gap-1 rounded-md border-2 border-dashed border-gray-300 p-1.5 text-gray-400 opacity-0 transition-all group-hover:opacity-100 hover:border-gray-400 hover:text-gray-600"
                    >
                      <Plus className="h-3 w-3" />
                      <span className="text-xs">Add a card</span>
                    </button>
                  )}
                </div>
              )}

              {isEditing && canEdit ? (
                <div className="flex items-center justify-end gap-1 border-t border-gray-200 p-2 text-sm">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={cancelEditingColumn}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => saveColumnName(column.id)}
                    disabled={isLoading || !columnDraft.trim()}
                  >
                    Save
                  </Button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <KanbanCardSidepanel
        card={cardModal?.card ?? null}
        open={!!cardModal}
        onClose={closeCardModal}
        onSave={saveCardModal}
        onDelete={() => {
          if (cardModal) {
            void deleteCard(cardModal.columnId, cardModal.card.id);
            closeCardModal();
          }
        }}
        onDuplicate={duplicateCard}
        canEdit={canEdit}
      />

      {/* Create Card Sidepanel */}
      <Sidepanel
        open={createCardDialogOpen}
        onOpenChange={setCreateCardDialogOpen}
        title="Create New Card"
        description="Add a new task to this column."
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Title *
            </label>
            <Input
              value={newCardTitle}
              onChange={(event) => setNewCardTitle(event.target.value)}
              placeholder="Enter card title"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleCreateCard();
                }
              }}
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              className="block h-32 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={newCardDescription}
              onChange={(event) => setNewCardDescription(event.target.value)}
              placeholder="Add a description (optional)"
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setCreateCardDialogOpen(false)}
              disabled={isCreatingCard}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCard}
              disabled={isCreatingCard || !newCardTitle.trim()}
              variant="primary"
            >
              {isCreatingCard ? "Creating..." : "Create Card"}
            </Button>
          </div>
        </div>
      </Sidepanel>
    </>
  );
}
