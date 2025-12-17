import { useState, useEffect, useMemo, useCallback } from "react";
import { useTemplateStore } from "../../stores/templateStore";
import { useCollectionStore } from "../../stores/collectionStore";
import { useToast } from "../../hooks/useToast";
import Button from "../UI/Button";
import EmptyState from "../EmptyStates/EmptyState";
import { Search, FileCode } from "lucide-react";
import TemplatePreview from "./TemplatePreview";
import TemplateCard from "./TemplateCard";
import PageLayout from "../Layout/PageLayout";
import PageToolbar from "../Layout/PageToolbar";
import Input from "../UI/Input";
import Select from "../UI/Select";

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

  const categories = useMemo(() => {
    return Array.from(
      new Set(templates.map((t) => t.template_category).filter(Boolean))
    ) as string[];
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      if (category && t.template_category !== category) return false;
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [templates, category, search]);

  const handlePreview = useCallback((templateId: string) => {
    setSelectedTemplate(templateId);
  }, []);

  const handleUse = useCallback((templateId: string) => {
    handleUseTemplate(templateId);
  }, []);

  const categoryOptions = useMemo(() => {
    return [
      { value: "", label: "All Categories" },
      ...categories.map((cat) => ({ value: cat, label: cat }))
    ];
  }, [categories]);

  const renderToolbar = useCallback(() => {
    return (
      <PageToolbar
        leftSection={
          <>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates..."
                className="pl-10"
                fullWidth
              />
            </div>
            {categories.length > 0 && (
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={categoryOptions}
                className="w-48"
              />
            )}
          </>
        }
      />
    );
  }, [search, category, categories, categoryOptions]);

  return (
    <>
      <PageLayout toolbar={renderToolbar()}>
        {/* Templates Grid */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onUse={handleUse}
                onPreview={handlePreview}
              />
            ))}
          </div>
        )}
      </PageLayout>

      {selectedTemplate && (
        <TemplatePreview
          templateId={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onUse={handleUseTemplate}
        />
      )}
    </>
  );
}





