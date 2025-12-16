/**
 * Schema Validation Panel
 * Hiển thị validation errors và warnings cho OpenAPI schema
 */

import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import Card from '../UI/Card';
import Badge from '../UI/Badge';
import { SchemaValidationError } from '../../stores/apiSchemaStore';

interface ValidationPanelProps {
  errors: SchemaValidationError[];
  onErrorClick?: (error: SchemaValidationError) => void;
}

export default function SchemaValidationPanel({ errors, onErrorClick }: ValidationPanelProps) {
  const errorCount = errors.filter((e) => e.level === 'error').length;
  const warningCount = errors.filter((e) => e.level === 'warning').length;
  const isValid = errors.length === 0;

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          {isValid ? (
            <>
              <CheckCircle2 size={18} className="text-green-600 dark:text-green-400" />
              <span>Schema Valid</span>
            </>
          ) : (
            <>
              <AlertCircle size={18} className="text-red-600 dark:text-red-400" />
              <span>Validation Issues</span>
            </>
          )}
          {errorCount > 0 && (
            <Badge variant="danger" size="sm">
              {errorCount} error{errorCount !== 1 ? 's' : ''}
            </Badge>
          )}
          {warningCount > 0 && (
            <Badge variant="warning" size="sm">
              {warningCount} warning{warningCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      }
    >
      {isValid ? (
        <div className="text-sm text-green-700 dark:text-green-300">
          Schema is valid and ready to use.
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {errors.map((error, index) => (
            <div
              key={index}
              className={`p-3 rounded border-2 ${
                error.level === 'error'
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                  : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
              } ${
                onErrorClick ? 'cursor-pointer hover:opacity-80' : ''
              }`}
              onClick={() => onErrorClick?.(error)}
            >
              <div className="flex items-start gap-2">
                {error.level === 'error' ? (
                  <AlertCircle
                    size={16}
                    className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0"
                  />
                ) : (
                  <AlertTriangle
                    size={16}
                    className="text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0"
                  />
                )}
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {error.path || 'Root'}
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      error.level === 'error'
                        ? 'text-red-700 dark:text-red-300'
                        : 'text-yellow-700 dark:text-yellow-300'
                    }`}
                  >
                    {error.message}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
