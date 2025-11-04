"use client";

import { useEffect, useState } from "react";
import { MoreVertical, Edit2, Copy, Trash2 } from "lucide-react";
import {
  Avatar,
  Button,
  Input,
  Sidepanel,
  DropdownMenu,
  DropdownMenuItem,
} from "~/components/ui";
import { getUserById, type UserResponse } from "~/lib/api/users";
import type { CardResponse } from "~/lib/api/cards";

interface KanbanCardSidepanelProps {
  card: CardResponse | null;
  open: boolean;
  onClose: () => void;
  onSave: (title: string, description: string) => Promise<void>;
  onDelete: () => void;
  onDuplicate: () => void;
  canEdit: boolean;
}

export function KanbanCardSidepanel({
  card,
  open,
  onClose,
  onSave,
  onDelete,
  onDuplicate,
  canEdit,
}: KanbanCardSidepanelProps) {
  const [cardCreator, setCardCreator] = useState<UserResponse | null>(null);
  const [loadingCreator, setLoadingCreator] = useState(false);
  const [cardDraft, setCardDraft] = useState({ title: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (card) {
      setCardDraft({
        title: card.title,
        description: card.description ?? "",
      });

      // Reset to view mode when card changes
      setIsEditing(false);

      // Fetch creator information
      setLoadingCreator(true);
      setCardCreator(null);
      getUserById(card.createdBy)
        .then(setCardCreator)
        .catch((err) => console.error("Failed to fetch card creator:", err))
        .finally(() => setLoadingCreator(false));
    }
  }, [card]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (!card) return;
    // Reset draft to original values
    setCardDraft({
      title: card.title,
      description: card.description ?? "",
    });
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!card) return;

    const title = cardDraft.title.trim();
    if (!title) return;

    setSaving(true);
    try {
      await onSave(title, cardDraft.description.trim());
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) return;
    setIsEditing(false);
    onClose();
  };

  const handleDelete = () => {
    onDelete();
    handleClose();
  };

  const handleDuplicate = () => {
    onDuplicate();
    handleClose();
  };

  return (
    <Sidepanel
      open={open}
      onOpenChange={(isOpen) => !isOpen && handleClose()}
      title={isEditing ? "Edit Card" : "Card Details"}
      hideCloseButton
      description={
        card ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-3">
              {loadingCreator ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="h-6 w-6 animate-pulse rounded-full bg-gray-200" />
                  <span>Loading creator...</span>
                </div>
              ) : cardCreator ? (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Avatar
                    src={cardCreator.image}
                    name={cardCreator.name}
                    size="sm"
                  />
                  <span>
                    Created by{" "}
                    <span className="font-medium">
                      {cardCreator.name ?? cardCreator.email}
                    </span>{" "}
                    on {new Date(card.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-gray-500">
                  Created {new Date(card.createdAt).toLocaleString()}
                </span>
              )}
            </div>
            {!isEditing && canEdit && (
              <DropdownMenu
                trigger={
                  <button
                    type="button"
                    className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                }
              >
                <DropdownMenuItem onSelect={handleEdit}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleDuplicate}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleDelete} variant="danger">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenu>
            )}
          </div>
        ) : undefined
      }
    >
      <div className="space-y-4">
        {isEditing ? (
          <>
            {/* Edit Mode */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Title
              </label>
              <Input
                value={cardDraft.title}
                onChange={(event) =>
                  setCardDraft((prev) => ({
                    ...prev,
                    title: event.target.value,
                  }))
                }
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                className="block h-32 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={cardDraft.description}
                onChange={(event) =>
                  setCardDraft((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* View Mode */}
            {card && (
              <>
                <div>
                  <h3 className="mb-1 text-sm font-medium text-gray-700">
                    Title
                  </h3>
                  <p className="text-base text-gray-900">{card.title}</p>
                </div>

                {card.description && (
                  <div>
                    <h3 className="mb-1 text-sm font-medium text-gray-700">
                      Description
                    </h3>
                    <p className="text-sm whitespace-pre-wrap text-gray-600">
                      {card.description}
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </Sidepanel>
  );
}
