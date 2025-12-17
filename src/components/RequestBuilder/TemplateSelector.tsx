/**
 * Template Selector Component
 * Dropdown để chọn template khi tạo request mới trong Request Builder
 */

import { useState, useEffect, useMemo } from 'react';
import { FileCode, ChevronDown, X, Search } from 'lucide-react';
import { useTemplateStore } from '../../stores/templateStore';
import { useToast } from '../../hooks/useToast';
import { useDebounce } from '../../hooks/useDebounce';
import Button from '../UI/Button';
import Input from '../UI/Input';
import EmptyState from '../EmptyStates/EmptyState';

export interface Template {
  id: string;
  name: string;
  method: string;
  url: string;
  description?: string;
  template_category?: string;
  headers?: Array<{ key: string; value: string }>;
  body?: string;
  queryParams?: Array<{ key: string; value: string; enabled: boolean }>;
}

export interface TemplateSelectorProps {
  onSelectTemplate: (template: Template) => void;
  className?: string;
}

export default function TemplateSelector({
  onSelectTemplate,
  className = '',
}: TemplateSelectorProps) {
  const { templates, setTemplates } = useTemplateStore();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const toast = useToast();

  useEffect(() => {
    // Load templates từ API nếu store chưa có
    if (templates.length === 0) {
      const loadTemplates = async () => {
        try {
          const token = localStorage.getItem("auth_token");
          if (!token) return;

          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/templates`,
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
        }
      };
      loadTemplates();
    }
  }, [templates.length, setTemplates]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(templates.map((t) => t.template_category).filter(Boolean))
    ) as string[];
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.url.toLowerCase().includes(query)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((t) => t.template_category === selectedCategory);
    }

    return filtered;
  }, [templates, debouncedSearchQuery, selectedCategory]);

  const handleSelect = (template: Template) => {
    onSelectTemplate(template);
    setIsOpen(false);
    setSearchQuery('');
    setSelectedCategory('');
    toast.success(`Đã áp dụng template: ${template.name}`);
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'POST':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'PUT':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'DELETE':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <FileCode size={16} />
        <span>Template</span>
        <ChevronDown size={14} className={isOpen ? 'rotate-180' : ''} />
      </Button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Chọn Template
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  type="text"
                  placeholder="Tìm kiếm template..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Categories */}
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === '' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setSelectedCategory('')}
                  >
                    Tất cả
                  </Button>
                  {categories.map((cat) => (
                    <Button
                      key={cat}
                      variant={selectedCategory === cat ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Template List */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredTemplates.length === 0 ? (
                <EmptyState
                  icon={FileCode}
                  title={searchQuery || selectedCategory ? "Không tìm thấy template" : "Chưa có template"}
                  description={
                    searchQuery || selectedCategory
                      ? "Thử điều chỉnh bộ lọc tìm kiếm"
                      : "Tạo template mới để sử dụng"
                  }
                />
              ) : (
                <div className="space-y-2">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => handleSelect(template)}
                      className="p-3 rounded border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer transition-colors bg-white dark:bg-gray-900"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                            {template.name}
                          </h4>
                          {template.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                              {template.description}
                            </p>
                          )}
                        </div>
                        <span
                          className={`px-2 py-0.5 text-xs font-semibold rounded flex-shrink-0 ml-2 ${getMethodColor(template.method)}`}
                        >
                          {template.method}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-500 font-mono truncate">
                        {template.url}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
