import { useState, useEffect } from "react";
import { useToast } from "../../hooks/useToast";
import Button from "../UI/Button";
import { X, Download } from "lucide-react";
import Editor from "@monaco-editor/react";

interface TemplatePreviewProps {
  templateId: string;
  onClose: () => void;
  onUse: (templateId: string) => void;
}

export default function TemplatePreview({ templateId, onUse, onClose }: TemplatePreviewProps) {
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadTemplate();
  }, [templateId]);

  const loadTemplate = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/templates/${templateId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTemplate(data);
      }
    } catch (error) {
      console.error("Failed to load template:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !template) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
          <p className="text-gray-900 dark:text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-[90vw] h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {template.name}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        {template.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {template.description}
          </p>
        )}

        <div className="flex-1 border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
          <Editor
            height="100%"
            defaultLanguage="json"
            value={JSON.stringify(template.data || {}, null, 2)}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
            }}
          />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => onUse(templateId)}>
            <Download size={14} className="mr-1" />
            Use Template
          </Button>
        </div>
      </div>
    </div>
  );
}




