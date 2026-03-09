import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type {
  BuilderMode,
  WebhookConfig,
  DiscordEmbed,
  EmbedField,
  TopLevelComponent,
  ContainerComponent,
  TextDisplayComponent,
  SectionComponent,
  SeparatorComponent,
  ActionRowComponent,
  ButtonComponent,
  MediaGalleryComponent,
  MediaGalleryItem,
  ThumbnailComponent,
} from "@/types/discord";
import { ComponentType, ButtonStyle } from "@/types/discord";

export function createEmptyEmbed(): DiscordEmbed {
  return {
    id: nanoid(),
    title: "",
    description: "",
    url: "",
    color: 0x5865f2,
    fields: [],
  };
}

export function createEmptyField(): EmbedField {
  return { id: nanoid(), name: "", value: "", inline: false };
}

export function createTextDisplay(content = ""): TextDisplayComponent {
  return { id: nanoid(), type: ComponentType.TextDisplay, content };
}

export function createSeparator(): SeparatorComponent {
  return { id: nanoid(), type: ComponentType.Separator, divider: true, spacing: 1 };
}

export function createButton(): ButtonComponent {
  return {
    id: nanoid(),
    type: ComponentType.Button,
    style: ButtonStyle.Primary,
    label: "Button",
    custom_id: nanoid(8),
  };
}

export function createActionRow(): ActionRowComponent {
  return {
    id: nanoid(),
    type: ComponentType.ActionRow,
    components: [createButton()],
  };
}

export function createThumbnail(): ThumbnailComponent {
  return {
    id: nanoid(),
    type: ComponentType.Thumbnail,
    media: { url: "" },
  };
}

export function createSection(): SectionComponent {
  return {
    id: nanoid(),
    type: ComponentType.Section,
    components: [createTextDisplay("Section text")],
  };
}

export function createMediaGalleryItem(): MediaGalleryItem {
  return { id: nanoid(), media: { url: "" } };
}

export function createMediaGallery(): MediaGalleryComponent {
  return {
    id: nanoid(),
    type: ComponentType.MediaGallery,
    items: [createMediaGalleryItem()],
  };
}

export function createContainer(): ContainerComponent {
  return {
    id: nanoid(),
    type: ComponentType.Container,
    accent_color: 0x5865f2,
    components: [createTextDisplay("Hello world!")],
  };
}

interface BuilderState {
  mode: BuilderMode;
  webhook: WebhookConfig;
  content: string;
  embeds: DiscordEmbed[];
  components: TopLevelComponent[];
  jsonEditorOpen: boolean;

  setMode: (mode: BuilderMode) => void;
  setWebhook: (webhook: Partial<WebhookConfig>) => void;

  setContent: (content: string) => void;
  addEmbed: () => void;
  removeEmbed: (id: string) => void;
  updateEmbed: (id: string, embed: Partial<DiscordEmbed>) => void;
  duplicateEmbed: (id: string) => void;
  moveEmbed: (id: string, direction: "up" | "down") => void;
  addField: (embedId: string) => void;
  removeField: (embedId: string, fieldId: string) => void;
  updateField: (embedId: string, fieldId: string, field: Partial<EmbedField>) => void;
  moveField: (embedId: string, fieldId: string, direction: "up" | "down") => void;

  addComponent: (component: TopLevelComponent) => void;
  removeComponent: (id: string) => void;
  updateComponent: (id: string, updater: (c: TopLevelComponent) => TopLevelComponent) => void;
  moveComponent: (id: string, direction: "up" | "down") => void;

  setJsonEditorOpen: (open: boolean) => void;
  importFromJson: (json: string) => boolean;
  reset: () => void;
}

export const useBuilderStore = create<BuilderState>()(
  persist(
    (set, get) => ({
  mode: "classic",
  webhook: { url: "" },
  content: "",
  embeds: [createEmptyEmbed()],
  components: [createContainer()],
  jsonEditorOpen: false,

  setMode: (mode) => set({ mode }),
  setWebhook: (webhook) =>
    set((s) => ({ webhook: { ...s.webhook, ...webhook } })),

  setContent: (content) => set({ content }),

  addEmbed: () =>
    set((s) => ({ embeds: [...s.embeds, createEmptyEmbed()] })),

  removeEmbed: (id) =>
    set((s) => ({ embeds: s.embeds.filter((e) => e.id !== id) })),

  updateEmbed: (id, updates) =>
    set((s) => ({
      embeds: s.embeds.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })),

  duplicateEmbed: (id) =>
    set((s) => {
      const idx = s.embeds.findIndex((e) => e.id === id);
      if (idx === -1) return s;
      const dup = {
        ...structuredClone(s.embeds[idx]),
        id: nanoid(),
        fields: s.embeds[idx].fields.map((f) => ({ ...f, id: nanoid() })),
      };
      const embeds = [...s.embeds];
      embeds.splice(idx + 1, 0, dup);
      return { embeds };
    }),

  moveEmbed: (id, direction) =>
    set((s) => {
      const idx = s.embeds.findIndex((e) => e.id === id);
      if (idx === -1) return s;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= s.embeds.length) return s;
      const embeds = [...s.embeds];
      [embeds[idx], embeds[newIdx]] = [embeds[newIdx], embeds[idx]];
      return { embeds };
    }),

  addField: (embedId) =>
    set((s) => ({
      embeds: s.embeds.map((e) =>
        e.id === embedId
          ? { ...e, fields: [...e.fields, createEmptyField()] }
          : e
      ),
    })),

  removeField: (embedId, fieldId) =>
    set((s) => ({
      embeds: s.embeds.map((e) =>
        e.id === embedId
          ? { ...e, fields: e.fields.filter((f) => f.id !== fieldId) }
          : e
      ),
    })),

  updateField: (embedId, fieldId, updates) =>
    set((s) => ({
      embeds: s.embeds.map((e) =>
        e.id === embedId
          ? {
              ...e,
              fields: e.fields.map((f) =>
                f.id === fieldId ? { ...f, ...updates } : f
              ),
            }
          : e
      ),
    })),

  moveField: (embedId, fieldId, direction) =>
    set((s) => ({
      embeds: s.embeds.map((e) => {
        if (e.id !== embedId) return e;
        const idx = e.fields.findIndex((f) => f.id === fieldId);
        if (idx === -1) return e;
        const newIdx = direction === "up" ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= e.fields.length) return e;
        const fields = [...e.fields];
        [fields[idx], fields[newIdx]] = [fields[newIdx], fields[idx]];
        return { ...e, fields };
      }),
    })),

  addComponent: (component) =>
    set((s) => ({ components: [...s.components, component] })),

  removeComponent: (id) =>
    set((s) => ({
      components: s.components.filter((c) => c.id !== id),
    })),

  updateComponent: (id, updater) =>
    set((s) => ({
      components: s.components.map((c) => (c.id === id ? updater(c) : c)),
    })),

  moveComponent: (id, direction) =>
    set((s) => {
      const idx = s.components.findIndex((c) => c.id === id);
      if (idx === -1) return s;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= s.components.length) return s;
      const components = [...s.components];
      [components[idx], components[newIdx]] = [components[newIdx], components[idx]];
      return { components };
    }),

  setJsonEditorOpen: (open) => set({ jsonEditorOpen: open }),

  importFromJson: (json) => {
    try {
      const data = JSON.parse(json);
      const state = get();

      if (state.mode === "classic") {
        if (data.content !== undefined) set({ content: data.content });
        if (data.embeds) {
          const embeds = data.embeds.map((e: DiscordEmbed) => ({
            ...e,
            id: e.id || nanoid(),
            fields: (e.fields || []).map((f: EmbedField) => ({
              ...f,
              id: f.id || nanoid(),
            })),
          }));
          set({ embeds });
        }
      } else {
        if (data.components) {
          type JsonObj = Record<string, unknown> & {
            id?: string;
            components?: JsonObj[];
            items?: JsonObj[];
          };
          const assignIds = (obj: JsonObj): JsonObj => {
            if (typeof obj !== "object" || obj === null) return obj;
            const result: JsonObj = { ...obj, id: obj.id || nanoid() };
            if (Array.isArray(result.components)) {
              result.components = result.components.map((c) => assignIds(c));
            }
            if (Array.isArray(result.items)) {
              result.items = result.items.map((i) => assignIds(i));
            }
            return result;
          };
          const components = data.components.map((c: JsonObj) =>
            assignIds(c)
          ) as TopLevelComponent[];
          set({ components });
        }
      }
      return true;
    } catch {
      return false;
    }
  },

  reset: () =>
    set({
      content: "",
      embeds: [createEmptyEmbed()],
      components: [createContainer()],
    }),
    }),
    {
      name: "embedcat-builder",
      partialize: (state) => ({
        mode: state.mode,
        webhook: state.webhook,
        content: state.content,
        embeds: state.embeds,
        components: state.components,
      }),
    }
  )
);
