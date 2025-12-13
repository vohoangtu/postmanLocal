import { useState } from "react";
import { useTabStore } from "../../stores/tabStore";
import Button from "../UI/Button";

interface Template {
  id: string;
  name: string;
  method: string;
  url: string;
  description?: string;
  category: "rest" | "graphql" | "websocket";
  headers?: Array<{ key: string; value: string }>;
  body?: string;
}

const defaultTemplates: Template[] = [
  {
    id: "get-example",
    name: "GET Request Example",
    method: "GET",
    url: "https://api.example.com/users",
    description: "Simple GET request example",
    category: "rest",
  },
  {
    id: "post-json",
    name: "POST JSON Request",
    method: "POST",
    url: "https://api.example.com/users",
    description: "POST request with JSON body",
    category: "rest",
    headers: [{ key: "Content-Type", value: "application/json" }],
    body: JSON.stringify({ name: "John Doe", email: "john@example.com" }, null, 2),
  },
  {
    id: "graphql-query",
    name: "GraphQL Query",
    method: "POST",
    url: "https://api.example.com/graphql",
    description: "GraphQL query example",
    category: "graphql",
    headers: [{ key: "Content-Type", value: "application/json" }],
    body: JSON.stringify(
      {
        query: "query { users { id name email } }",
      },
      null,
      2
    ),
  },
];

export default function RequestTemplates() {
  const [templates] = useState<Template[]>(defaultTemplates);
  const [selectedCategory, setSelectedCategory] = useState<"all" | Template["category"]>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { addTab } = useTabStore();

  const filteredTemplates = templates.filter((template) => {
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleUseTemplate = (template: Template) => {
    addTab({
      name: template.name,
      method: template.method,
      url: template.url,
      requestData: {
        headers: template.headers || [],
        body: template.body,
      },
    });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Request Templates
        </h3>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search templates..."
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded mb-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <div className="flex gap-2">
          <Button
            variant={selectedCategory === "all" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
          >
            All
          </Button>
          <Button
            variant={selectedCategory === "rest" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setSelectedCategory("rest")}
          >
            REST
          </Button>
          <Button
            variant={selectedCategory === "graphql" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setSelectedCategory("graphql")}
          >
            GraphQL
          </Button>
          <Button
            variant={selectedCategory === "websocket" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setSelectedCategory("websocket")}
          >
            WebSocket
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
            No templates found
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer bg-white dark:bg-gray-900"
                onClick={() => handleUseTemplate(template)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {template.name}
                  </h4>
                  <span
                    className={`px-2 py-0.5 text-xs rounded ${
                      template.method === "GET"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    }`}
                  >
                    {template.method}
                  </span>
                </div>
                {template.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {template.description}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-500 font-mono truncate">
                  {template.url}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

