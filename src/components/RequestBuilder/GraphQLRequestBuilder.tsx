import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import Button from "../UI/Button";
import { useToast } from "../../hooks/useToast";
import { useEnvironmentStore } from "../../stores/environmentStore";
import { executeGraphQL, validateQuery, formatQuery, introspectSchema, GraphQLResponse } from "../../services/graphqlService";
import { Loader2, Play, FileCode, CheckCircle, XCircle, Sidebar } from "lucide-react";
import SchemaExplorer from "./SchemaExplorer";
import ComponentErrorBoundary from "../Error/ComponentErrorBoundary";

interface GraphQLRequestBuilderProps {
  url: string;
  headers: Record<string, string>;
  onResponse: (response: GraphQLResponse) => void;
}

export default function GraphQLRequestBuilder({
  url,
  headers,
  onResponse,
}: GraphQLRequestBuilderProps) {
  const [query, setQuery] = useState(`query {
  # Enter your GraphQL query here
}`);
  const [variables, setVariables] = useState("{}");
  const [operationName, setOperationName] = useState("");
  const [activeTab, setActiveTab] = useState<"query" | "variables">("query");
  const [loading, setLoading] = useState(false);
  const [schema, setSchema] = useState<any>(null);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showSchemaExplorer, setShowSchemaExplorer] = useState(false);
  const toast = useToast();
  const { replaceVariables } = useEnvironmentStore();

  useEffect(() => {
    // Validate query on change
    const validation = validateQuery(query);
    setValidationErrors(validation.errors);
  }, [query]);

  const handleIntrospect = async () => {
    if (!url) {
      toast.error("Please enter a GraphQL endpoint URL");
      return;
    }

    setLoadingSchema(true);
    try {
      const resolvedUrl = replaceVariables(url);
      const resolvedHeaders = Object.fromEntries(
        Object.entries(headers).map(([k, v]) => [k, replaceVariables(v)])
      );

      const schemaData = await introspectSchema(resolvedUrl, resolvedHeaders);
      setSchema(schemaData);
      toast.success("Schema introspected successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to introspect schema");
    } finally {
      setLoadingSchema(false);
    }
  };

  const handleSend = async () => {
    if (!url) {
      toast.error("Please enter a GraphQL endpoint URL");
      return;
    }

    const validation = validateQuery(query);
    if (!validation.valid) {
      toast.error(`Query validation failed: ${validation.errors.join(", ")}`);
      return;
    }

    setLoading(true);
    try {
      const resolvedUrl = replaceVariables(url);
      const resolvedHeaders = Object.fromEntries(
        Object.entries(headers).map(([k, v]) => [k, replaceVariables(v)])
      );

      let variablesObj: Record<string, any> = {};
      try {
        variablesObj = JSON.parse(variables || "{}");
      } catch (e) {
        toast.error("Invalid JSON in variables");
        setLoading(false);
        return;
      }

      const response = await executeGraphQL(
        resolvedUrl,
        {
          query,
          variables: variablesObj,
          operationName: operationName || undefined,
        },
        resolvedHeaders
      );

      onResponse(response);
      
      if (response.errors) {
        toast.error(`GraphQL errors: ${response.errors.map((e) => e.message).join(", ")}`);
      } else {
        toast.success("Query executed successfully");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to execute GraphQL query");
      onResponse({
        errors: [{ message: error.message || "Failed to execute GraphQL query" }],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormat = () => {
    try {
      const formatted = formatQuery(query);
      setQuery(formatted);
      toast.success("Query formatted");
    } catch (error: any) {
      toast.error("Failed to format query");
    }
  };

  const handleInsertField = (fieldName: string) => {
    // Insert field vào query tại vị trí cursor
    const editor = (window as any).monacoEditor;
    if (editor) {
      const selection = editor.getSelection();
      const range = new (window as any).monaco.Range(
        selection.startLineNumber,
        selection.startColumn,
        selection.endLineNumber,
        selection.endColumn
      );
      const text = fieldName;
      const op = { range, text };
      editor.executeEdits("insert-field", [op]);
    } else {
      // Fallback: append to query
      setQuery((prev) => prev + `\n  ${fieldName}`);
    }
  };

  return (
    <ComponentErrorBoundary componentName="GraphQL Request Builder">
      <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex items-center border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("query")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "query"
              ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          }`}
        >
          Query
        </button>
        <button
          onClick={() => setActiveTab("variables")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "variables"
              ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          }`}
        >
          Variables
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-2 px-4">
          {validationErrors.length > 0 && (
            <div className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs">
              <XCircle size={14} />
              {validationErrors.length} error(s)
            </div>
          )}
          {validationErrors.length === 0 && query.trim() && (
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs">
              <CheckCircle size={14} />
              Valid
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFormat}
            title="Format query"
          >
            <FileCode size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleIntrospect}
            disabled={loadingSchema || !url}
            loading={loadingSchema}
            title="Introspect schema"
          >
            Schema
          </Button>
          {schema && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSchemaExplorer(!showSchemaExplorer)}
              title="Toggle schema explorer"
            >
              <Sidebar size={14} />
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={handleSend}
            disabled={loading || !url || validationErrors.length > 0}
            loading={loading}
          >
            <Play size={14} className="mr-1" />
            Execute
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex">
        <div className={showSchemaExplorer ? "flex-1" : "w-full"}>
          {activeTab === "query" ? (
            <Editor
              height="100%"
              defaultLanguage="graphql"
              value={query}
              onChange={(value) => setQuery(value || "")}
              onMount={(editor) => {
                // Store editor instance for field insertion
                (window as any).monacoEditor = editor;
              }}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: "on",
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
              }}
            />
          ) : (
            <Editor
              height="100%"
              defaultLanguage="json"
              value={variables}
              onChange={(value) => setVariables(value || "{}")}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: "on",
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          )}
        </div>
        {showSchemaExplorer && schema && (
          <div className="w-64 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <SchemaExplorer schema={schema} onInsertField={handleInsertField} />
          </div>
        )}
      </div>

      {/* Schema Info (if available) */}
      {schema && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-2 bg-gray-50 dark:bg-gray-900 max-h-32 overflow-y-auto">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <strong>Schema:</strong> {schema.__schema?.queryType?.name && `Query: ${schema.__schema.queryType.name}`}
            {schema.__schema?.mutationType?.name && ` | Mutation: ${schema.__schema.mutationType.name}`}
            {schema.__schema?.subscriptionType?.name && ` | Subscription: ${schema.__schema.subscriptionType.name}`}
          </div>
        </div>
      )}

      {/* Operation Name */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-2 flex items-center gap-2">
        <label className="text-xs text-gray-600 dark:text-gray-400">Operation Name:</label>
        <input
          type="text"
          value={operationName}
          onChange={(e) => setOperationName(e.target.value)}
          placeholder="Optional"
          className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
    </div>
    </ComponentErrorBoundary>
  );
}


