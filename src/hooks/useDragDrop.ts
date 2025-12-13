import { useState, useCallback } from "react";

interface DragDropState {
  isDragging: boolean;
  draggedId: string | null;
  draggedData: any;
}

export const useDragDrop = () => {
  const [dragState, setDragState] = useState<DragDropState>({
    isDragging: false,
    draggedId: null,
    draggedData: null,
  });

  const handleDragStart = useCallback((id: string, data: any) => {
    setDragState({
      isDragging: true,
      draggedId: id,
      draggedData: data,
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedId: null,
      draggedData: null,
    });
  }, []);

  return {
    dragState,
    handleDragStart,
    handleDragEnd,
  };
};

