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

function getStoredLocale(): "en" | "ru" {
  if (typeof window === "undefined") return "en";
  try {
    const stored = localStorage.getItem("embedcat-locale");
    if (stored === "ru") return "ru";
  } catch {
    void 0;
  }
  return "en";
}

const welcomeEmbedStrings = {
  en: {
    title: "🐱 Welcome to embed.cat!",
    description: "This is your first embed! Start editing it using the panel on the left, or ask the **AI assistant** to create something.\n\n**What you can do:**\n• Change text, colors, images\n• Add fields, buttons, author\n• Use **Components V2**\n• Send embeds via webhook",
    footer: "embed.cat — simple Discord embed builder",
    tipName: "💡 Tip",
    tipValue: "Type something in the AI chat like:\n*\"Make a red embed with server rules\"*",
    linksName: "🔗 Links",
    linksValue: "[Documentation](https://embed.cat/docs) • [Discord](https://discord.gg/HvZGEYEgt5)",
  },
  ru: {
    title: "🐱 Добро пожаловать в embed.cat!",
    description: "Это твой первый эмбед! Начни редактировать его с помощью панели слева или попроси **AI-помощника** создать что-нибудь.\n\n**Что можно делать:**\n• Менять текст, цвет, картинки\n• Добавлять поля, кнопки, автора\n• Использовать **Components V2**\n• Отправлять эмбеды через вебхук",
    footer: "embed.cat — простой конструктор эмбедов для Discord",
    tipName: "💡 Совет",
    tipValue: "Напиши в чат с AI что-то вроде:\n*«Сделай красный эмбед с правилами сервера»*",
    linksName: "🔗 Ссылки",
    linksValue: "[Документация](https://embed.cat/docs) • [Discord](https://discord.gg/HvZGEYEgt5)",
  },
};

function createWelcomeEmbed(locale?: "en" | "ru"): DiscordEmbed {
  const lang = locale ?? getStoredLocale();
  const s = welcomeEmbedStrings[lang];
  return {
    id: nanoid(),
    title: s.title,
    description: s.description,
    color: 0x5865f2,
    footer: { text: s.footer },
    thumbnail: { url: "https://rin.ms/embedcat.png" },
    fields: [
      { id: nanoid(), name: s.tipName, value: s.tipValue, inline: true },
      { id: nanoid(), name: s.linksName, value: s.linksValue, inline: true },
    ],
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

const welcomeContainerStrings = {
  en: {
    heading: "# 🐱 Welcome to embed.cat!",
    intro: "This is **Components V2** — Discord's new message layout system. You can use text, sections, separators, galleries, and buttons.\n\nStart editing from the panel on the left, or ask the **AI assistant** to create something.",
    tip: "### 💡 Tip\nType something in the AI chat like:\n*\"Make a red embed with server rules\"*",
    features: "### ✨ What you can do\n• Text with **markdown** and headings\n• Sections with images and buttons\n• Image galleries\n• Separators and link buttons",
    docsBtn: "📖 Documentation",
    discordBtn: "💬 Discord",
  },
  ru: {
    heading: "# 🐱 Добро пожаловать в embed.cat!",
    intro: "Это **Components V2** — новый способ оформления сообщений в Discord. Здесь можно использовать текст, секции, разделители, галереи и кнопки.\n\nНачни редактировать с панели слева или попроси **AI-помощника** создать что-нибудь.",
    tip: "### 💡 Совет\nНапиши в чат с AI что-то вроде:\n*«Сделай красный эмбед с правилами сервера»*",
    features: "### ✨ Что можно делать\n• Текст с **маркдауном** и заголовками\n• Секции с картинками и кнопками\n• Галереи изображений\n• Разделители и кнопки-ссылки",
    docsBtn: "📖 Документация",
    discordBtn: "💬 Discord",
  },
};

function createWelcomeContainer(locale?: "en" | "ru"): ContainerComponent {
  const lang = locale ?? getStoredLocale();
  const s = welcomeContainerStrings[lang];
  return {
    id: nanoid(),
    type: ComponentType.Container,
    accent_color: 0x5865f2,
    components: [
      { id: nanoid(), type: ComponentType.TextDisplay, content: s.heading },
      { id: nanoid(), type: ComponentType.Separator, divider: true, spacing: 1 },
      { id: nanoid(), type: ComponentType.TextDisplay, content: s.intro },
      { id: nanoid(), type: ComponentType.Separator, divider: true, spacing: 1 },
      {
        id: nanoid(),
        type: ComponentType.Section,
        components: [
          { id: nanoid(), type: ComponentType.TextDisplay, content: s.tip },
        ],
        accessory: { id: nanoid(), type: ComponentType.Thumbnail, media: { url: "https://rin.ms/embedcat.png" } },
      },
      { id: nanoid(), type: ComponentType.Separator, divider: true, spacing: 1 },
      { id: nanoid(), type: ComponentType.TextDisplay, content: s.features },
      { id: nanoid(), type: ComponentType.Separator, divider: true, spacing: 1 },
      {
        id: nanoid(),
        type: ComponentType.ActionRow,
        components: [
          { id: nanoid(), type: ComponentType.Button, style: ButtonStyle.Link, label: s.docsBtn, url: "https://embed.cat/docs" },
          { id: nanoid(), type: ComponentType.Button, style: ButtonStyle.Link, label: s.discordBtn, url: "https://discord.gg/HvZGEYEgt5" },
        ],
      },
    ],
  };
}

type Snapshot = {
  content: string;
  embeds: DiscordEmbed[];
  components: TopLevelComponent[];
};

const MAX_HISTORY = 100;
const undoStack: Snapshot[] = [];
const redoStack: Snapshot[] = [];
let skipSnapshot = false;

function takeSnapshot(state: Snapshot) {
  undoStack.push(structuredClone(state));
  if (undoStack.length > MAX_HISTORY) undoStack.shift();
  redoStack.length = 0;
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
  reorderEmbeds: (fromIndex: number, toIndex: number) => void;
  addField: (embedId: string) => void;
  removeField: (embedId: string, fieldId: string) => void;
  updateField: (embedId: string, fieldId: string, field: Partial<EmbedField>) => void;
  moveField: (embedId: string, fieldId: string, direction: "up" | "down") => void;
  reorderFields: (embedId: string, fromIndex: number, toIndex: number) => void;

  toggleEmbedHidden: (id: string) => void;
  toggleComponentHidden: (id: string) => void;

  addComponent: (component: TopLevelComponent) => void;
  removeComponent: (id: string) => void;
  updateComponent: (id: string, updater: (c: TopLevelComponent) => TopLevelComponent) => void;
  moveComponent: (id: string, direction: "up" | "down") => void;
  reorderComponents: (fromIndex: number, toIndex: number) => void;

  setJsonEditorOpen: (open: boolean) => void;
  importFromJson: (json: string) => boolean;
  loadFromPayload: (mode: BuilderMode, payload: Record<string, unknown>) => void;
  reset: () => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useBuilderStore = create<BuilderState>()(
  persist(
    (rawSet, get) => {
  const snap = () => {
    if (skipSnapshot) return;
    const s = get();
    takeSnapshot({ content: s.content, embeds: s.embeds, components: s.components });
  };
  const set: typeof rawSet = (partial, replace?) => {
    snap();
    rawSet(partial as Parameters<typeof rawSet>[0], replace as undefined);
  };
  return {
  mode: "classic",
  webhook: { url: "" },
  content: "",
  embeds: [createWelcomeEmbed()],
  components: [createWelcomeContainer()],
  jsonEditorOpen: false,

  setMode: (mode) => rawSet({ mode }),
  setWebhook: (webhook) =>
    rawSet((s) => ({ webhook: { ...s.webhook, ...webhook } })),

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

  reorderEmbeds: (fromIndex, toIndex) =>
    set((s) => {
      const embeds = [...s.embeds];
      const [moved] = embeds.splice(fromIndex, 1);
      embeds.splice(toIndex, 0, moved);
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

  reorderFields: (embedId, fromIndex, toIndex) =>
    set((s) => ({
      embeds: s.embeds.map((e) => {
        if (e.id !== embedId) return e;
        const fields = [...e.fields];
        const [moved] = fields.splice(fromIndex, 1);
        fields.splice(toIndex, 0, moved);
        return { ...e, fields };
      }),
    })),

  toggleEmbedHidden: (id) =>
    set((s) => ({
      embeds: s.embeds.map((e) =>
        e.id === id ? { ...e, hidden: !e.hidden } : e
      ),
    })),

  toggleComponentHidden: (id) =>
    set((s) => {
      const toggleInChildren = (items: TopLevelComponent[]): TopLevelComponent[] =>
        items.map((c) => {
          if (c.id === id) return { ...c, hidden: !c.hidden } as TopLevelComponent;
          if (c.type === 17) {
            const ct = c as ContainerComponent;
            const updated = ct.components.map((child) =>
              child.id === id ? { ...child, hidden: !child.hidden } : child
            );
            if (updated !== ct.components) return { ...ct, components: updated } as TopLevelComponent;
          }
          return c;
        });
      return { components: toggleInChildren(s.components) };
    }),

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

  reorderComponents: (fromIndex, toIndex) =>
    set((s) => {
      const components = [...s.components];
      const [moved] = components.splice(fromIndex, 1);
      components.splice(toIndex, 0, moved);
      return { components };
    }),

  setJsonEditorOpen: (open) => set({ jsonEditorOpen: open }),

  importFromJson: (json) => {
    try {
      const data = JSON.parse(json);
      const state = get();

      if (state.mode === "classic") {
        if (data.content !== undefined) set({ content: data.content || "" });
        if (data.embeds) {
          const embeds = data.embeds.map((e: Record<string, unknown>) => ({
            ...e,
            id: (e.id as string) || nanoid(),
            color: typeof e.color === "number" ? e.color : undefined,
            title: (e.title as string) || "",
            description: (e.description as string) || "",
            url: (e.url as string) || "",
            fields: (Array.isArray(e.fields) ? e.fields : []).map((f: Record<string, unknown>) => ({
              ...f,
              id: (f.id as string) || nanoid(),
              name: (f.name as string) || "",
              value: (f.value as string) || "",
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

  loadFromPayload: (mode, payload) => {
    rawSet({ mode });
    const json = JSON.stringify(payload);
    get().importFromJson(json);
  },

  reset: () =>
    set((s) =>
      s.mode === "classic"
        ? { content: "", embeds: [createEmptyEmbed()] }
        : { components: [createContainer()] }
    ),

  undo: () => {
    const snapshot = undoStack.pop();
    if (!snapshot) return;
    const s = get();
    redoStack.push(structuredClone({ content: s.content, embeds: s.embeds, components: s.components }));
    skipSnapshot = true;
    rawSet(snapshot);
    skipSnapshot = false;
  },

  redo: () => {
    const snapshot = redoStack.pop();
    if (!snapshot) return;
    const s = get();
    undoStack.push(structuredClone({ content: s.content, embeds: s.embeds, components: s.components }));
    skipSnapshot = true;
    rawSet(snapshot);
    skipSnapshot = false;
  },

  canUndo: () => undoStack.length > 0,
  canRedo: () => redoStack.length > 0,
  };
    },
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
