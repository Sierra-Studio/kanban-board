"use client";

import { useMemo, useState, type DragEvent } from "react";
import { Plus, ChevronDown, ChevronRight, Edit2 } from "lucide-react";

import { Button, Input, Sidepanel } from "~/components/ui";
import { useToast } from "~/components/ui/toast";
import { renameColumnRequest, toggleColumnCollapseRequest, reorderColumnsRequest } from "~/lib/api/columns";
import {
  createCardRequest,
  deleteCardRequest,
  updateCardRequest,
} from "~/lib/api/cards";
import { useBoardDragDrop } from "../hooks/useBoardDragDrop";
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

type BoardColumnsManagerProps = {
  boardId: string;
  role: string;
  initialColumns: ColumnState[];
};

const EDITABLE_ROLES = new Set(["owner", "admin", "member"]);

type DragState =
  | { type: "column"; columnId: string }
  | { type: "card"; cardId: string; sourceColumnId: string } 
  | null;

function clampIndex(index: number, length: number) {
  if (index < 0) return 0;
  if (index > length) return length;
  return index;
}

export function BoardColumnsManager({ boardId, role, initialColumns }: BoardColumnsManagerProps) {
  const canEdit = useMemo(() => EDITABLE_ROLES.has(role), [role]);
  const { addToast } = useToast();

  const [columns, setColumns] = useState<ColumnState[]>(initialColumns);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [columnDraft, setColumnDraft] = useState("");
  const [columnLoadingId, setColumnLoadingId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState>(null);
  const [cardModal, setCardModal] = useState<{ columnId: string; card: CardResponse } | null>(null);
  const [cardModalDraft, setCardModalDraft] = useState<{ title: string; description: string }>({
    title: "",
    description: "",
  });
  const [savingModal, setSavingModal] = useState(false);

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

  const handleColumnDragStart = (columnId: string, event: DragEvent<HTMLDivElement>) => {
    if (!canEdit) return;
    setDragState({ type: "column", columnId });
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", columnId);
  };

  const handleColumnDrop = async (targetColumnId: string) => {
    if (dragState?.type !== "column") return;
    const sourceId = dragState.columnId;
    if (sourceId === targetColumnId) {
      setDragState(null);
      return;
    }

    const sourceIndex = columns.findIndex((column) => column.id === sourceId);
    const targetIndex = columns.findIndex((column) => column.id === targetColumnId);
    if (sourceIndex < 0 || targetIndex < 0) {
      setDragState(null);
      return;
    }

    const updatedColumns = [...columns];
    const [removed] = updatedColumns.splice(sourceIndex, 1);
    if (!removed) {
      setDragState(null);
      return;
    }
    updatedColumns.splice(targetIndex, 0, removed);
    setColumns(updatedColumns);

    try {
      await reorderColumnsRequest(boardId, updatedColumns.map((column) => column.id));
      addToast("Columns reordered", "success");
    } catch (error) {
      console.error("Column reorder error", error);
      addToast(
        error instanceof Error ? error.message : "Failed to reorder columns",
        "error",
      );
      setColumns(columns);
    } finally {
      setDragState(null);
    }
  };

  const handleColumnDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!canEdit) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

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
      const updated = await toggleColumnCollapseRequest(column.id, !column.isCollapsed);
      setColumns((prev) =>
        prev.map((current) =>
          current.id === column.id
            ? { ...current, isCollapsed: updated.isCollapsed, updatedAt: updated.updatedAt }
            : current,
        ),
      );
      addToast(updated.isCollapsed ? "Column collapsed" : "Column expanded", "success");
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
    setCardModalDraft({
      title: card.title,
      description: card.description ?? "",
    });
  };

  const closeCardModal = () => {
    if (savingModal) return;
    setCardModal(null);
    setCardModalDraft({ title: "", description: "" });
  };

  const saveCardModal = async () => {
    if (!cardModal || !canEdit) return;
    const { card } = cardModal;
    const title = cardModalDraft.title.trim();
    const description = cardModalDraft.description.trim();

    if (!title) {
      addToast("Title is required", "error");
      return;
    }

    setSavingModal(true);
    try {
      const updated = await updateCardRequest(card.id, {
        title,
        description: description || null,
      });

      setColumns((prev) =>
        prev.map((column) =>
          column.id === updated.columnId
            ? {
                ...column,
                cards: column.cards.map((item) => (item.id === updated.id ? updated : item)),
              }
            : column,
        ),
      );

      addToast("Card updated", "success");
      closeCardModal();
    } catch (error) {
      console.error("Update card error", error);
      addToast(
        error instanceof Error ? error.message : "Failed to update card",
        "error",
      );
    } finally {
      setSavingModal(false);
    }
  };

  const deleteCard = async (columnId: string, cardId: string) => {
    if (!canEdit) return;
    const confirmDelete = window.confirm("Delete this card? This action cannot be undone.");
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

  const [createCardDialogOpen, setCreateCardDialogOpen] = useState(false);
  const [createCardColumnId, setCreateCardColumnId] = useState<string | null>(null);
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
      <div className="grid grid-cols-3 gap-4 h-full" style={{ gridAutoRows: '100%' }}>
        {columns.map((column) => {
          const isEditing = editingColumnId === column.id;
          const isLoading = columnLoadingId === column.id;

          return (
            <div
              key={column.id}
              className={`group relative rounded-lg bg-gray-100 flex flex-col min-h-0 ${
                dragState?.type === "column" && dragState.columnId === column.id
                  ? "ring-2 ring-blue-500"
                  : ""
              }`}
              draggable={canEdit}
              onDragStart={(event) => handleColumnDragStart(column.id, event)}
              onDragOver={handleColumnDragOver}
              onDrop={() => handleColumnDrop(column.id)}
            >
              <div className="flex items-end justify-between gap-2 px-3 py-2.5 border-b border-gray-200">
                {isEditing ? (
                  <Input
                    value={columnDraft}
                    onChange={(event) => setColumnDraft(event.target.value)}
                    disabled={isLoading}
                    autoFocus
                  />
                ) : (
                  <div className="flex items-baseline gap-2 flex-1">
                    <h3 className="text-base font-semibold text-gray-900">{column.name}</h3>
                    <p className="text-xs text-gray-500">
                      {column.cards.length} {column.cards.length === 1 ? 'card' : 'cards'}
                    </p>
                  </div>
                )}

                {canEdit ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEditingColumn(column)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Rename column"
                      disabled={isLoading}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleColumnCollapse(column)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title={column.isCollapsed ? "Expand" : "Collapse"}
                      disabled={isLoading}
                    >
                      {column.isCollapsed ? (
                        <ChevronRight className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ) : null}
              </div>

              {!column.isCollapsed && (
                <div
                  className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2"
                  onDragOver={(event) => handleCardDropAreaDragOver(column.id, event)}
                  onDrop={handleCardDrop}
                >
                  {column.cards.map((card, index) => (
                    <div key={card.id} className="relative">
                      {/* Drop indicator above card */}
                      {dropIndicator?.columnId === column.id && dropIndicator.index === index && (
                        <div className="absolute -top-1 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
                      )}

                      <div
                        className={`rounded-lg bg-white p-3 shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-200 hover:border-gray-300 ${
                          cardDragState?.type === "card" && cardDragState.cardId === card.id
                            ? "opacity-50"
                            : ""
                        }`}
                        draggable={canEdit}
                        onDragStart={(event) => handleCardDragStart(column.id, card, event)}
                        onDragOver={(event) => handleCardDragOver(column.id, index, event)}
                        onDrop={handleCardDrop}
                        onClick={() => openCardModal(column.id, card)}
                      >
                        <p className="text-sm font-medium text-gray-900 leading-snug">{card.title}</p>
                        {card.description ? (
                          <p className="mt-2 text-xs text-gray-500 line-clamp-2 leading-relaxed">{card.description}</p>
                        ) : null}
                      </div>

                      {/* Drop indicator below last card */}
                      {dropIndicator?.columnId === column.id &&
                       dropIndicator.index === index + 1 &&
                       index === column.cards.length - 1 && (
                        <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
                      )}
                    </div>
                  ))}

                  {/* Drop indicator for empty column or end of list */}
                  {column.cards.length === 0 && dropIndicator?.columnId === column.id && (
                    <div className="h-0.5 bg-blue-500 rounded-full" />
                  )}

                  {/* Add card button - shows on hover */}
                  {canEdit && (
                    <button
                      onClick={() => handleOpenCreateCard(column.id)}
                      className="w-full p-1.5 rounded-md border-2 border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span className="text-xs">Add a card</span>
                    </button>
                  )}
                </div>
              )}

              {isEditing && canEdit ? (
                <div className="p-2 border-t border-gray-200 flex items-center justify-end gap-1 text-sm">
                  <Button size="sm" variant="secondary" onClick={cancelEditingColumn}>
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

      <Sidepanel
        open={!!cardModal}
        onOpenChange={(open) => !open && closeCardModal()}
        title="Edit Card"
        description={cardModal ? `Created ${new Date(cardModal.card.createdAt).toLocaleString()}` : undefined}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
            <Input
              value={cardModalDraft.title}
              onChange={(event) =>
                setCardModalDraft((prev) => ({ ...prev, title: event.target.value }))
              }
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              className="block h-32 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={cardModalDraft.description}
              onChange={(event) =>
                setCardModalDraft((prev) => ({ ...prev, description: event.target.value }))
              }
            />
          </div>

          <div className="mt-6 flex items-center justify-between">
            {cardModal && canEdit && (
              <Button
                variant="ghost"
                onClick={() => {
                  if (cardModal) {
                    deleteCard(cardModal.columnId, cardModal.card.id);
                    closeCardModal();
                  }
                }}
                className="text-red-600 hover:text-red-700"
              >
                Delete Card
              </Button>
            )}
            <div className="ml-auto flex items-center gap-2">
              <Button variant="secondary" onClick={closeCardModal} disabled={savingModal}>
                Cancel
              </Button>
              <Button onClick={saveCardModal} disabled={savingModal}>
                {savingModal ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </Sidepanel>

      {/* Create Card Sidepanel */}
      <Sidepanel
        open={createCardDialogOpen}
        onOpenChange={setCreateCardDialogOpen}
        title="Create New Card"
        description="Add a new task to this column."
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Title *</label>
            <Input
              value={newCardTitle}
              onChange={(event) => setNewCardTitle(event.target.value)}
              placeholder="Enter card title"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleCreateCard();
                }
              }}
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              className="block h-32 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
