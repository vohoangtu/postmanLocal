import { useState, useEffect } from "react";
import { useSchemaStore } from "../../stores/schemaStore";

interface SchemaEditorProps {
  onSchemaSelect?: (schema: any) => void;
}

export default function SchemaEditor({ onSchemaSelect }: SchemaEditorProps) {
  const {
    schemas,
    selectedSchema,
    setSelectedSchema,
    addSchema,
    updateSchema,
    getSchema,
  } = useSchemaStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSchemaName, setNewSchemaName] = useState("");
  const [schemaContent, setSchemaContent] = useState("");
  const [editingSchema, setEditingSchema] = useState<string | null>(null);

  useEffect(() => {
    if (selectedSchema) {
      const schema = getSchema(selectedSchema);
      if (schema) {
        setSchemaContent(JSON.stringify(schema.schemaData, null, 2));
        setEditingSchema(selectedSchema);
      }
    }
  }, [selectedSchema, getSchema]);

  const handleCreateSchema = () => {
    if (!newSchemaName.trim() || !schemaContent.trim()) return;

    try {
      const parsed = JSON.parse(schemaContent);
      const newSchema = {
        id: Date.now().toString(),
        name: newSchemaName,
        schemaData: parsed,
        createdAt: new Date().toISOString(),
      };

      addSchema(newSchema);
      setNewSchemaName("");
      setSchemaContent("");
      setShowCreateModal(false);
    } catch (error) {
      alert("Invalid JSON schema");
    }
  };

  const handleSaveSchema = () => {
    if (!editingSchema) return;

    try {
      const parsed = JSON.parse(schemaContent);
      updateSchema(editingSchema, { schemaData: parsed });
      alert("Schema saved successfully");
    } catch (error) {
      alert("Invalid JSON schema");
    }
  };


  const defaultSchema = {
    openapi: "3.0.0",
    info: {
      title: "API Schema",
      version: "1.0.0",
    },
    paths: {},
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            API Schemas
          </h3>
          <button
            onClick={() => {
              setSchemaContent(JSON.stringify(defaultSchema, null, 2));
              setShowCreateModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            + New Schema
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto p-4">
          <div className="space-y-2">
            {schemas.map((schema) => (
              <div
                key={schema.id}
                onClick={() => {
                  setSelectedSchema(schema.id);
                  onSchemaSelect?.(schema);
                }}
                className={`p-2 rounded cursor-pointer text-sm ${
                  selectedSchema === schema.id
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                {schema.name}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {editingSchema ? (
            <>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {getSchema(editingSchema)?.name}
                </h4>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveSchema}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingSchema(null);
                      setSchemaContent("");
                    }}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <textarea
                  value={schemaContent}
                  onChange={(e) => setSchemaContent(e.target.value)}
                  className="w-full h-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                  placeholder="Enter OpenAPI schema (JSON format)"
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
              Select a schema to edit or create a new one
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-[800px] max-h-[90vh] flex flex-col">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Create New Schema
            </h3>
            <input
              type="text"
              value={newSchemaName}
              onChange={(e) => setNewSchemaName(e.target.value)}
              placeholder="Schema name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <textarea
              value={schemaContent || JSON.stringify(defaultSchema, null, 2)}
              onChange={(e) => setSchemaContent(e.target.value)}
              className="flex-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
              placeholder="Enter OpenAPI schema (JSON format)"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewSchemaName("");
                  setSchemaContent("");
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSchema}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


