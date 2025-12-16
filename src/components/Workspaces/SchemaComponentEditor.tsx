/**
 * Schema Component Editor
 * Editor cho components trong OpenAPI schema (schemas, parameters, responses)
 */

import { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, ChevronDown, ChevronRight } from 'lucide-react';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Card from '../UI/Card';

interface ComponentEditorProps {
  components: {
    schemas?: { [name: string]: any };
    parameters?: { [name: string]: any };
    responses?: { [name: string]: any };
    requestBodies?: { [name: string]: any };
  };
  onUpdate: (components: any) => void;
}

type ComponentType = 'schemas' | 'parameters' | 'responses' | 'requestBodies';

export default function SchemaComponentEditor({ components, onUpdate }: ComponentEditorProps) {
  const [expandedSections, setExpandedSections] = useState<Set<ComponentType>>(
    new Set(['schemas'])
  );
  const [editingComponent, setEditingComponent] = useState<{
    type: ComponentType;
    name: string;
  } | null>(null);

  const toggleSection = (type: ComponentType) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedSections(newExpanded);
  };

  const handleAddComponent = (type: ComponentType, name: string) => {
    const newComponents = { ...components };
    if (!newComponents[type]) {
      newComponents[type] = {};
    }

    const defaultComponent: any = {
      schemas: { type: 'object', properties: {} },
      parameters: { name: name, in: 'query', schema: { type: 'string' } },
      responses: { description: 'Response description' },
      requestBodies: { content: { 'application/json': { schema: { type: 'object' } } } },
    };

    newComponents[type]![name] = defaultComponent[type];
    onUpdate(newComponents);
    setEditingComponent({ type, name });
  };

  const handleUpdateComponent = (type: ComponentType, name: string, data: any) => {
    const newComponents = { ...components };
    if (!newComponents[type]) {
      newComponents[type] = {};
    }
    newComponents[type]![name] = data;
    onUpdate(newComponents);
  };

  const handleDeleteComponent = (type: ComponentType, name: string) => {
    const newComponents = { ...components };
    if (newComponents[type]) {
      delete newComponents[type]![name];
      if (Object.keys(newComponents[type]!).length === 0) {
        delete newComponents[type];
      }
    }
    onUpdate(newComponents);
  };

  const renderComponentList = (type: ComponentType, label: string) => {
    const isExpanded = expandedSections.has(type);
    const items = components[type] || {};

    return (
      <Card className="mb-3">
        <div
          className="flex items-center justify-between cursor-pointer p-3"
          onClick={() => toggleSection(type)}
        >
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown size={16} className="text-gray-500" />
            ) : (
              <ChevronRight size={16} className="text-gray-500" />
            )}
            <h4 className="font-semibold text-gray-900 dark:text-white">{label}</h4>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({Object.keys(items).length})
            </span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              const name = prompt(`Enter ${label.slice(0, -1)} name:`);
              if (name) {
                handleAddComponent(type, name);
              }
            }}
            className="flex items-center gap-1"
          >
            <Plus size={14} />
            Add
          </Button>
        </div>

        {isExpanded && (
          <div className="border-t-2 border-gray-200 dark:border-gray-700 p-3 space-y-2">
            {Object.keys(items).length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No {label.toLowerCase()} defined
              </div>
            ) : (
              Object.entries(items).map(([name, data]) => (
                <div
                  key={name}
                  className="border-2 border-gray-200 dark:border-gray-700 rounded p-2"
                >
                  <div className="flex items-center justify-between mb-2">
                    <code className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {name}
                    </code>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteComponent(type, name)}
                      className="flex items-center gap-1"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    <pre className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-xs overflow-x-auto">
                      {JSON.stringify(data, null, 2)}
                    </pre>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Card>
    );
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Components
      </h3>
      {renderComponentList('schemas', 'Schemas')}
      {renderComponentList('parameters', 'Parameters')}
      {renderComponentList('responses', 'Responses')}
      {renderComponentList('requestBodies', 'Request Bodies')}
    </div>
  );
}
