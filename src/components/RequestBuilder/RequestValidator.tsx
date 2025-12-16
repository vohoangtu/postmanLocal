/**
 * Request Validator Component
 * Validate request trước khi save
 */

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import Badge from '../UI/Badge';

interface RequestValidatorProps {
  method: string;
  url: string;
  headers: Array<{ key: string; value: string }>;
  body?: string;
  queryParams?: Array<{ key: string; value: string; enabled: boolean }>;
}

interface ValidationError {
  type: 'error' | 'warning' | 'info';
  field: string;
  message: string;
}

export default function RequestValidator({
  method,
  url,
  headers,
  body,
  queryParams,
}: RequestValidatorProps) {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    validate();
  }, [method, url, headers, body, queryParams]);

  const validate = () => {
    const validationErrors: ValidationError[] = [];

    // Validate URL
    if (!url.trim()) {
      validationErrors.push({
        type: 'error',
        field: 'url',
        message: 'URL is required',
      });
    } else {
      try {
        // Try to parse URL (allows relative URLs)
        if (url.startsWith('http://') || url.startsWith('https://')) {
          new URL(url);
        } else if (!url.startsWith('/') && !url.startsWith('{{')) {
          validationErrors.push({
            type: 'warning',
            field: 'url',
            message: 'URL should start with http://, https://, or /',
          });
        }
      } catch (e) {
        validationErrors.push({
          type: 'error',
          field: 'url',
          message: 'Invalid URL format',
        });
      }
    }

    // Validate method
    const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
    if (!validMethods.includes(method.toUpperCase())) {
      validationErrors.push({
        type: 'error',
        field: 'method',
        message: 'Invalid HTTP method',
      });
    }

    // Validate headers
    headers.forEach((header, index) => {
      if (header.key && !header.value) {
        validationErrors.push({
          type: 'warning',
          field: `header-${index}`,
          message: `Header "${header.key}" has no value`,
        });
      }
      if (!header.key && header.value) {
        validationErrors.push({
          type: 'warning',
          field: `header-${index}`,
          message: 'Header has value but no key',
        });
      }
    });

    // Validate body for methods that require it
    if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      if (!body || !body.trim()) {
        validationErrors.push({
          type: 'info',
          field: 'body',
          message: 'Request body is empty (may be intentional)',
        });
      } else {
        // Try to validate JSON if body looks like JSON
        if (body.trim().startsWith('{') || body.trim().startsWith('[')) {
          try {
            JSON.parse(body);
          } catch (e) {
            validationErrors.push({
              type: 'error',
              field: 'body',
              message: 'Invalid JSON format in request body',
            });
          }
        }
      }
    }

    // Validate query parameters
    queryParams?.forEach((param, index) => {
      if (param.key && !param.value && param.enabled) {
        validationErrors.push({
          type: 'info',
          field: `query-${index}`,
          message: `Query parameter "${param.key}" has no value`,
        });
      }
    });

    setErrors(validationErrors);
    setIsValid(validationErrors.filter((e) => e.type === 'error').length === 0);
  };

  if (errors.length === 0) {
    return (
      <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border-2 border-green-300 dark:border-green-700">
        <CheckCircle2 size={16} className="text-green-600 dark:text-green-400" />
        <span className="text-sm font-medium text-green-800 dark:text-green-200">
          Request is valid
        </span>
      </div>
    );
  }

  const errorCount = errors.filter((e) => e.type === 'error').length;
  const warningCount = errors.filter((e) => e.type === 'warning').length;
  const infoCount = errors.filter((e) => e.type === 'info').length;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border-2 border-red-300 dark:border-red-700">
        <XCircle size={16} className="text-red-600 dark:text-red-400" />
        <span className="text-sm font-semibold text-red-800 dark:text-red-200">
          {errorCount} error{errorCount !== 1 ? 's' : ''} found
        </span>
        {warningCount > 0 && (
          <Badge variant="warning" size="sm">
            {warningCount} warning{warningCount !== 1 ? 's' : ''}
          </Badge>
        )}
        {infoCount > 0 && (
          <Badge variant="secondary" size="sm">
            {infoCount} info
          </Badge>
        )}
      </div>

      <div className="space-y-1 max-h-48 overflow-y-auto">
        {errors.map((error, index) => (
          <div
            key={index}
            className={`flex items-start gap-2 p-2 rounded text-sm ${
              error.type === 'error'
                ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                : error.type === 'warning'
                ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200'
                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
            }`}
          >
            {error.type === 'error' ? (
              <XCircle size={14} className="flex-shrink-0 mt-0.5" />
            ) : error.type === 'warning' ? (
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <span className="font-medium">{error.field}:</span> {error.message}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
