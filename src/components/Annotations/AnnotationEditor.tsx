import { useState, useEffect } from "react";
import { Plus, Trash2, StickyNote, Highlighter } from "lucide-react";
import Button from "../UI/Button";
import { useToast } from "../../hooks/useToast";

interface Annotation {
  id: string;
  user_id: string;
  type: "note" | "highlight";
  content: string;
  position?: Record<string, any>;
  created_at: string;
  user?: {
    id: string;
    name: string;
  };
}

interface AnnotationEditorProps {
  requestId: string;
}

export default function AnnotationEditor({ requestId }: AnnotationEditorProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAnnotationType, setNewAnnotationType] = useState<"note" | "highlight">("note");
  const [newAnnotationContent, setNewAnnotationContent] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadAnnotations();
  }, [requestId]);

  const loadAnnotations = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/requests/${requestId}/annotations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAnnotations(data);
      }
    } catch (error) {
      console.error("Failed to load annotations:", error);
    }
  };

  const handleAddAnnotation = async () => {
    if (!newAnnotationContent.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        toast.error("Vui lòng đăng nhập");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/requests/${requestId}/annotations`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: newAnnotationType,
            content: newAnnotationContent,
            position: {}, // Can be enhanced to capture actual position
          }),
        }
      );

      if (response.ok) {
        toast.success("Annotation added");
        setNewAnnotationContent("");
        setShowAddForm(false);
        await loadAnnotations();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to add annotation");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to add annotation");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnnotation = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa annotation này?")) return;

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/annotations/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Annotation deleted");
        await loadAnnotations();
      } else {
        toast.error("Failed to delete annotation");
      }
    } catch (error) {
      toast.error("Failed to delete annotation");
    }
  };

  const currentUserId = localStorage.getItem("user_id");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Annotations
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus size={14} className="mr-1" />
          Add Annotation
        </Button>
      </div>

      {showAddForm && (
        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
          <div className="space-y-2">
            <select
              value={newAnnotationType}
              onChange={(e) => setNewAnnotationType(e.target.value as "note" | "highlight")}
              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="note">Note</option>
              <option value="highlight">Highlight</option>
            </select>
            <textarea
              value={newAnnotationContent}
              onChange={(e) => setNewAnnotationContent(e.target.value)}
              placeholder="Annotation content..."
              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddForm(false);
                  setNewAnnotationContent("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddAnnotation}
                disabled={loading || !newAnnotationContent.trim()}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {annotations.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No annotations yet
          </p>
        ) : (
          annotations.map((annotation) => (
            <div
              key={annotation.id}
              className={`p-3 rounded border ${
                annotation.type === "highlight"
                  ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                  : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              }`}
            >
              <div className="flex items-start gap-2">
                {annotation.type === "highlight" ? (
                  <Highlighter size={16} className="text-yellow-600 dark:text-yellow-400 mt-0.5" />
                ) : (
                  <StickyNote size={16} className="text-gray-600 dark:text-gray-400 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {annotation.user?.name || "Unknown"}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(annotation.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {annotation.content}
                  </p>
                </div>
                {annotation.user_id === currentUserId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAnnotation(annotation.id)}
                  >
                    <Trash2 size={12} />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}




