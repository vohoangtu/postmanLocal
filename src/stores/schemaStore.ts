import { create } from "zustand";

interface Schema {
  id: string;
  name: string;
  schemaData: any; // OpenAPI 3.0 compatible
  createdAt?: string;
}

interface SchemaStore {
  schemas: Schema[];
  selectedSchema: string | null;
  setSchemas: (schemas: Schema[]) => void;
  setSelectedSchema: (id: string | null) => void;
  addSchema: (schema: Schema) => void;
  updateSchema: (id: string, updates: Partial<Schema>) => void;
  deleteSchema: (id: string) => void;
  getSchema: (id: string) => Schema | undefined;
}

export const useSchemaStore = create<SchemaStore>((set, get) => ({
  schemas: [],
  selectedSchema: null,
  setSchemas: (schemas) => set({ schemas }),
  setSelectedSchema: (id) => set({ selectedSchema: id }),
  addSchema: (schema) =>
    set((state) => ({ schemas: [...state.schemas, schema] })),
  updateSchema: (id, updates) =>
    set((state) => ({
      schemas: state.schemas.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),
  deleteSchema: (id) =>
    set((state) => ({
      schemas: state.schemas.filter((s) => s.id !== id),
      selectedSchema: state.selectedSchema === id ? null : state.selectedSchema,
    })),
  getSchema: (id) => get().schemas.find((s) => s.id === id),
}));


