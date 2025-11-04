"use client";

import { useEffect, useState, type DragEvent } from "react";
import { Avatar } from "~/components/ui";
import { getUserById, type UserResponse } from "~/lib/api/users";
import type { CardResponse } from "~/lib/api/cards";

interface KanbanCardProps {
  card: CardResponse;
  isDragging: boolean;
  canEdit: boolean;
  onCardClick: () => void;
  onDragStart: (event: DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
}

export function KanbanCard({
  card,
  isDragging,
  canEdit,
  onCardClick,
  onDragStart,
  onDragOver,
  onDrop,
}: KanbanCardProps) {
  const [creator, setCreator] = useState<UserResponse | null>(null);

  useEffect(() => {
    getUserById(card.createdBy)
      .then(setCreator)
      .catch((err) => console.error("Failed to fetch card creator:", err));
  }, [card.createdBy]);

  return (
    <div
      className={`rounded-lg bg-white p-3 shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-200 hover:border-gray-300 ${
        isDragging ? "opacity-50" : ""
      }`}
      draggable={canEdit}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onCardClick}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-900 leading-snug flex-1">
          {card.title}
        </p>
        {creator && (
          <Avatar src={creator.image} name={creator.name} size="xs" />
        )}
      </div>
      {card.description ? (
        <p className="mt-2 text-xs text-gray-500 line-clamp-2 leading-relaxed">
          {card.description}
        </p>
      ) : null}
    </div>
  );
}
