import { useState, useEffect } from "react";
import { useTemplateStore } from "../../stores/templateStore";
import { useCollectionStore } from "../../stores/collectionStore";
import { useToast } from "../../hooks/useToast";
import Button from "../UI/Button";
import EmptyState from "../EmptyStates/EmptyState";
import { Search, FileCode, Tag, Folder } from "lucide-react";
import TemplatePreview from "./TemplatePreview";

export default function TemplateLibrary() {
  const { templates, setTemplates } = useTemplateStore();
  const { addCollection } = useCollectionStore();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (category) params.append("category", category);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/templates?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data || data);
      }
    } catch (error) {
      console.error("Failed to load templates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      loadTemplates();
    }, 300);

    return () => clearTimeout(debounce);
  }, [search, category]);

  const handleUseTemplate = async (templateId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/templates/${templateId}/use`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const collection = await response.json();
        addCollection({
          id: collection.id.toString(),
          name: collection.name,
          description: collection.description,
          requests: [],
        });
        toast.success("Collection created from template");
        setSelectedTemplate(null);
      } else {
        toast.error("Failed to use template");
      }
    } catch (error) {
      toast.error("Failed to use template");
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(
    new Set(templates.map((t) => t.template_category).filter(Boolean))
  ) as string[];

  const filteredTemplates = templates.filter((t) => {
    if (category && t.template_category !== category) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Template Library
        </h3>
      </div>

      {/* Search and Filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        {categories.length > 0 && (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Templates List */}
      {loading && templates.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          Loading templates...
        </div>
      ) : filteredTemplates.length === 0 ? (
        <EmptyState
          icon={FileCode}
          title="No templates found"
          description="Templates will appear here when team members publish collections as templates"
        />
      ) : (
        <div className="space-y-2">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              onClick={() => setSelectedTemplate(template.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {template.name}
                  </h4>
                  {template.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {template.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    {template.template_category && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                        <Folder size={12} />
                        {template.template_category}
                      </span>
                    )}
                    {template.template_tags && template.template_tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Tag size={12} className="text-gray-400" />
                        {template.template_tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-xs text-gray-500 dark:text-gray-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUseTemplate(template.id);
                  }}
                  disabled={loading}
                >
                  Use
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedTemplate && (
        <TemplatePreview
          templateId={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onUse={handleUseTemplate}
        />
      )}
    </div>
  );
}


