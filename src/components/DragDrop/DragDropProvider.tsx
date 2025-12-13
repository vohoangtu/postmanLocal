import { createContext, useContext, ReactNode } from "react";

interface DragDropContextType {
  onDragStart: (id: string, data: any) => void;
  onDragEnd: () => void;
  onDrop: (targetId: string) => void;
  draggedItem: { id: string; data: any } | null;
}

const DragDropContext = createContext<DragDropContextType | null>(null);

export const useDragDrop = () => {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error("useDragDrop must be used within DragDropProvider");
  }
  return context;
};

interface DragDropProviderProps {
  children: ReactNode;
  onDrop: (sourceId: string, targetId: string, data: any) => void;
}

export default function DragDropProvider({ children, onDrop: handleDrop }: DragDropProviderProps) {
  let draggedItem: { id: string; data: any } | null = null;

  const onDragStart = (id: string, data: any) => {
    draggedItem = { id, data };
  };

  const onDragEnd = () => {
    draggedItem = null;
  };

  const onDrop = (targetId: string) => {
    if (draggedItem) {
      handleDrop(draggedItem.id, targetId, draggedItem.data);
      draggedItem = null;
    }
  };

  return (
    <DragDropContext.Provider value={{ onDragStart, onDragEnd, onDrop, draggedItem }}>
      {children}
    </DragDropContext.Provider>
  );
}

