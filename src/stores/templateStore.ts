import { create } from "zustand";

export interface Template {
  id: string;
  name: string;
  description?: string;
  template_category?: string;
  template_tags?: string[];
  user?: {
    id: string;
    name: string;
  };
  created_at: string;
}

interface TemplateStore {
  templates: Template[];
  setTemplates: (templates: Template[]) => void;
  addTemplate: (template: Template) => void;
  removeTemplate: (id: string) => void;
}

export const useTemplateStore = create<TemplateStore>((set) => ({
  templates: [],

  setTemplates: (templates) => set({ templates }),

  addTemplate: (template) =>
    set((state) => ({
      templates: [...state.templates, template],
    })),

  removeTemplate: (id) =>
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== id),
    })),
}));





