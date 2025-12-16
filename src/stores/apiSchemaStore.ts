/**
 * API Schema Store
 * Quản lý state cho API schemas trong workspace
 */

import { create } from 'zustand';

export interface OpenAPISchema {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
    contact?: {
      name?: string;
      email?: string;
      url?: string;
    };
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  paths: {
    [path: string]: {
      [method: string]: {
        summary?: string;
        description?: string;
        operationId?: string;
        tags?: string[];
        parameters?: Array<{
          name: string;
          in: 'query' | 'header' | 'path' | 'cookie';
          required?: boolean;
          description?: string;
          schema?: any;
        }>;
        requestBody?: {
          description?: string;
          required?: boolean;
          content?: {
            [contentType: string]: {
              schema?: any;
              example?: any;
            };
          };
        };
        responses?: {
          [statusCode: string]: {
            description?: string;
            content?: {
              [contentType: string]: {
                schema?: any;
                example?: any;
              };
            };
          };
        };
      };
    };
  };
  components?: {
    schemas?: {
      [name: string]: any;
    };
    parameters?: {
      [name: string]: any;
    };
    responses?: {
      [name: string]: any;
    };
    requestBodies?: {
      [name: string]: any;
    };
  };
}

export interface ApiSchema {
  id: string;
  name: string;
  workspace_id?: string;
  user_id: string;
  schema_data: OpenAPISchema;
  created_at?: string;
  updated_at?: string;
}

export interface SchemaValidationError {
  path: string;
  message: string;
  level: 'error' | 'warning';
}

interface ApiSchemaStore {
  schemas: ApiSchema[];
  selectedSchema: string | null;
  validationErrors: SchemaValidationError[];
  isLoading: boolean;
  
  setSchemas: (schemas: ApiSchema[]) => void;
  setSelectedSchema: (id: string | null) => void;
  addSchema: (schema: ApiSchema) => void;
  updateSchema: (id: string, updates: Partial<ApiSchema>) => void;
  deleteSchema: (id: string) => void;
  getSchema: (id: string) => ApiSchema | undefined;
  setValidationErrors: (errors: SchemaValidationError[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useApiSchemaStore = create<ApiSchemaStore>((set, get) => ({
  schemas: [],
  selectedSchema: null,
  validationErrors: [],
  isLoading: false,
  
  setSchemas: (schemas) => set({ schemas }),
  setSelectedSchema: (id) => set({ selectedSchema: id }),
  addSchema: (schema) =>
    set((state) => ({ schemas: [...state.schemas, schema] })),
  updateSchema: (id, updates) =>
    set((state) => ({
      schemas: state.schemas.map((s) => 
        s.id === id ? { ...s, ...updates } : s
      ),
    })),
  deleteSchema: (id) =>
    set((state) => ({
      schemas: state.schemas.filter((s) => s.id !== id),
      selectedSchema: state.selectedSchema === id ? null : state.selectedSchema,
    })),
  getSchema: (id) => get().schemas.find((s) => s.id === id),
  setValidationErrors: (errors) => set({ validationErrors: errors }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
