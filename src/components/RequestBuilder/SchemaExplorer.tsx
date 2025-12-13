import { useState } from "react";
import { ChevronRight, ChevronDown, FileText, Zap, Radio } from "lucide-react";

interface SchemaType {
  kind: string;
  name?: string;
  description?: string;
  fields?: Array<{
    name: string;
    description?: string;
    type: SchemaTypeRef;
    args?: Array<{
      name: string;
      type: SchemaTypeRef;
      defaultValue?: string;
    }>;
  }>;
  inputFields?: Array<{
    name: string;
    description?: string;
    type: SchemaTypeRef;
    defaultValue?: string;
  }>;
  enumValues?: Array<{
    name: string;
    description?: string;
  }>;
  possibleTypes?: Array<{ name: string }>;
}

interface SchemaTypeRef {
  kind: string;
  name?: string;
  ofType?: SchemaTypeRef;
}

interface SchemaExplorerProps {
  schema: any;
  onInsertField?: (fieldPath: string) => void;
}

export default function SchemaExplorer({ schema, onInsertField }: SchemaExplorerProps) {
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  const [selectedType, setSelectedType] = useState<string | null>(null);

  if (!schema || !schema.__schema) {
    return (
      <div className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
        Chưa có schema. Click "Schema" để introspect.
      </div>
    );
  }

  const schemaData = schema.__schema;
  const types = schemaData.types || [];
  const queryType = schemaData.queryType;
  const mutationType = schemaData.mutationType;
  const subscriptionType = schemaData.subscriptionType;

  const toggleType = (typeName: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(typeName)) {
      newExpanded.delete(typeName);
    } else {
      newExpanded.add(typeName);
    }
    setExpandedTypes(newExpanded);
  };

  const formatType = (type: SchemaTypeRef): string => {
    if (!type) return "Unknown";
    if (type.kind === "NON_NULL") {
      return `${formatType(type.ofType!)}!`;
    }
    if (type.kind === "LIST") {
      return `[${formatType(type.ofType!)}]`;
    }
    return type.name || type.kind;
  };

  const renderType = (type: SchemaType) => {
    if (!type.name || type.name.startsWith("__")) return null;

    const isExpanded = expandedTypes.has(type.name);
    const isSelected = selectedType === type.name;

    return (
      <div key={type.name} className="mb-1">
        <div
          className={`flex items-center gap-1 p-1 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
            isSelected ? "bg-blue-100 dark:bg-blue-900" : ""
          }`}
          onClick={() => {
            toggleType(type.name!);
            setSelectedType(type.name!);
          }}
        >
          {type.fields || type.inputFields || type.enumValues ? (
            isExpanded ? (
              <ChevronDown size={14} className="text-gray-400" />
            ) : (
              <ChevronRight size={14} className="text-gray-400" />
            )
          ) : (
            <div className="w-3" />
          )}
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {type.name}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
            ({type.kind})
          </span>
        </div>

        {isExpanded && (
          <div className="ml-4 mt-1 space-y-1">
            {type.fields && type.fields.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Fields:
                </div>
                {type.fields.map((field) => (
                  <div
                    key={field.name}
                    className="p-1 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer"
                    onClick={() => onInsertField?.(field.name)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 dark:text-white font-medium">
                        {field.name}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {formatType(field.type)}
                      </span>
                    </div>
                    {field.description && (
                      <div className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                        {field.description}
                      </div>
                    )}
                    {field.args && field.args.length > 0 && (
                      <div className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">
                        Args: {field.args.map((a) => `${a.name}: ${formatType(a.type)}`).join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {type.inputFields && type.inputFields.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Input Fields:
                </div>
                {type.inputFields.map((field) => (
                  <div key={field.name} className="p-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 dark:text-white font-medium">
                        {field.name}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {formatType(field.type)}
                      </span>
                      {field.defaultValue && (
                        <span className="text-gray-400 dark:text-gray-500">
                          = {field.defaultValue}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {type.enumValues && type.enumValues.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Enum Values:
                </div>
                {type.enumValues.map((value) => (
                  <div key={value.name} className="p-1 text-xs text-gray-700 dark:text-gray-300">
                    {value.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto p-2">
      <div className="space-y-3">
        {/* Query Type */}
        {queryType && (
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-900 dark:text-white">
              <Zap size={14} />
              Query
            </div>
            {types
              .find((t: SchemaType) => t.name === queryType.name)
              ?.fields?.map((field) => (
                <div
                  key={field.name}
                  className="p-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer mb-1"
                  onClick={() => onInsertField?.(field.name)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 dark:text-white font-medium">
                      {field.name}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {formatType(field.type)}
                    </span>
                  </div>
                  {field.description && (
                    <div className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                      {field.description}
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}

        {/* Mutation Type */}
        {mutationType && (
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-900 dark:text-white">
              <Radio size={14} />
              Mutation
            </div>
            {types
              .find((t: SchemaType) => t.name === mutationType.name)
              ?.fields?.map((field) => (
                <div
                  key={field.name}
                  className="p-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer mb-1"
                  onClick={() => onInsertField?.(field.name)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 dark:text-white font-medium">
                      {field.name}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {formatType(field.type)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* All Types */}
        <div>
          <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-900 dark:text-white">
            <FileText size={14} />
            All Types
          </div>
          <div className="space-y-0">
            {types
              .filter((t: SchemaType) => t.name && !t.name.startsWith("__"))
              .map((t: SchemaType) => renderType(t))}
          </div>
        </div>
      </div>
    </div>
  );
}
