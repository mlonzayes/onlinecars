"use client";

import { useState, useCallback } from "react";

// Generic native HTML5 drag-and-drop reorder hook.
// Extraído de vehicle-image-uploader para reusarlo en sections-list y gallery-grid.
//
// Patrón:
// - El consumidor renderiza items y aplica `getHandlers(item.id)` a cada elemento.
// - `draggingId` y `dragOverId` permiten estilar el item arrastrado y el target.
// - `onReorder(next)` se llama con la nueva lista ya reordenada. El consumidor
//   típicamente hace optimistic update + persist async + rollback en error.
export interface DragReorderHandlers {
  draggable: boolean;
  onDragStart: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
  onDragEnd: (event: React.DragEvent) => void;
}

export interface UseDragReorderResult {
  draggingId: string | null;
  dragOverId: string | null;
  getHandlers: (itemId: string) => DragReorderHandlers;
}

export function useDragReorder<T extends { id: string }>(
  items: T[],
  onReorder: (next: T[]) => void
): UseDragReorderResult {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const reset = useCallback(() => {
    setDraggingId(null);
    setDragOverId(null);
  }, []);

  const getHandlers = useCallback(
    (itemId: string): DragReorderHandlers => ({
      draggable: true,
      onDragStart: (event) => {
        // dataTransfer required en Firefox para que dispare drag.
        event.dataTransfer.effectAllowed = "move";
        try {
          event.dataTransfer.setData("text/plain", itemId);
        } catch {
          // algunos browsers tiran si no es user-initiated; ignorar.
        }
        setDraggingId(itemId);
      },
      onDragOver: (event) => {
        event.preventDefault();
        if (draggingId && draggingId !== itemId) {
          setDragOverId(itemId);
        }
      },
      onDrop: (event) => {
        event.preventDefault();
        if (!draggingId || draggingId === itemId) {
          reset();
          return;
        }
        const fromIdx = items.findIndex((i) => i.id === draggingId);
        const toIdx = items.findIndex((i) => i.id === itemId);
        if (fromIdx < 0 || toIdx < 0) {
          reset();
          return;
        }
        const next = [...items];
        const [moved] = next.splice(fromIdx, 1);
        next.splice(toIdx, 0, moved);
        reset();
        onReorder(next);
      },
      onDragEnd: () => {
        reset();
      },
    }),
    [draggingId, items, onReorder, reset]
  );

  return { draggingId, dragOverId, getHandlers };
}
