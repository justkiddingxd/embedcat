import type {
  DiscordEmbed,
  EmbedField,
  TopLevelComponent,
  WebhookConfig,
  ContainerComponent,
  SectionComponent,
  ActionRowComponent,
  MediaGalleryComponent,
  TextDisplayComponent,
  SeparatorComponent,
  ThumbnailComponent,
  ButtonComponent,
  FileComponent,
  ContainerChild,
} from "@/types/discord";
import { IS_COMPONENTS_V2, ButtonStyle } from "@/types/discord";
import type { ActionItem, ButtonActionConfig } from "@/store/builder-store";
import { EMBEDCAT_LOGO_URL } from "@/lib/utils";

// --- Strip internal IDs from objects before sending to Discord ---

function stripId<T extends { id?: string }>(obj: T): Omit<T, "id"> {
  const { id: _, ...rest } = obj;
  return rest;
}

function cleanField(f: EmbedField) {
  const clean = stripId(f);
  // Remove empty optional fields
  if (!clean.inline) delete clean.inline;
  return clean;
}

function cleanEmbed(e: DiscordEmbed) {
  const clean = stripId(e);
  const result: Record<string, unknown> = {};

  if (clean.title) result.title = clean.title;
  if (clean.description) result.description = clean.description;
  if (clean.url) result.url = clean.url;
  if (clean.color !== undefined) result.color = clean.color;
  if (clean.timestamp) result.timestamp = clean.timestamp;
  if (clean.author?.name) result.author = clean.author;
  if (clean.footer?.text) result.footer = clean.footer;
  if (clean.image?.url) result.image = clean.image;
  if (clean.thumbnail?.url) result.thumbnail = clean.thumbnail;
  if (clean.fields.length > 0) result.fields = clean.fields.map(cleanField);

  return result;
}

function cleanButton(b: ButtonComponent): Record<string, unknown> {
  const clean = stripId(b);
  const result: Record<string, unknown> = { type: clean.type, style: clean.style };
  if (clean.label) result.label = clean.label;
  if (clean.emoji) result.emoji = clean.emoji;
  if (clean.style === 5) {
    if (clean.url) result.url = clean.url;
  } else {
    if (clean.custom_id) result.custom_id = clean.custom_id;
  }
  if (clean.disabled) result.disabled = clean.disabled;
  return result;
}

function cleanThumbnail(t: ThumbnailComponent): Record<string, unknown> {
  const result: Record<string, unknown> = { type: t.type, media: t.media };
  if (t.description) result.description = t.description;
  if (t.spoiler) result.spoiler = t.spoiler;
  return result;
}

function cleanComponent(c: TopLevelComponent | ContainerChild): Record<string, unknown> {
  switch (c.type) {
    case 17: { // Container
      const ct = c as ContainerComponent;
      const result: Record<string, unknown> = {
        type: ct.type,
        components: ct.components.filter((ch) => !ch.hidden).map(cleanComponent),
      };
      if (ct.accent_color !== undefined) result.accent_color = ct.accent_color;
      if (ct.spoiler) result.spoiler = ct.spoiler;
      return result;
    }
    case 9: { // Section
      const s = c as SectionComponent;
      const result: Record<string, unknown> = {
        type: s.type,
        components: s.components.map((t) => stripId(t)),
      };
      if (s.accessory) {
        result.accessory =
          s.accessory.type === 2
            ? cleanButton(s.accessory as ButtonComponent)
            : cleanThumbnail(s.accessory as ThumbnailComponent);
      }
      return result;
    }
    case 1: { // ActionRow
      const ar = c as ActionRowComponent;
      return {
        type: ar.type,
        components: ar.components.map(cleanButton),
      };
    }
    case 10: { // TextDisplay
      const td = c as TextDisplayComponent;
      return { type: td.type, content: td.content };
    }
    case 12: { // MediaGallery
      const mg = c as MediaGalleryComponent;
      return {
        type: mg.type,
        items: mg.items.map((i) => {
          const item: Record<string, unknown> = { media: i.media };
          if (i.description) item.description = i.description;
          if (i.spoiler) item.spoiler = i.spoiler;
          return item;
        }),
      };
    }
    case 14: { // Separator
      const sep = c as SeparatorComponent;
      return { type: sep.type, divider: sep.divider, spacing: sep.spacing };
    }
    case 13: { // File
      const f = c as FileComponent;
      const result: Record<string, unknown> = { type: f.type, file: f.file };
      if (f.spoiler) result.spoiler = f.spoiler;
      return result;
    }
    default:
      return stripId(c);
  }
}

function isEmptyComponent(c: Record<string, unknown>): boolean {
  switch (c.type) {
    case 10: // TextDisplay
      return !c.content || (typeof c.content === "string" && !c.content.trim());
    case 12: { // MediaGallery
      const items = c.items as { media?: { url?: string } }[] | undefined;
      return !items || items.length === 0 || items.every((i) => !i.media?.url);
    }
    case 9: { // Section
      const comps = c.components as { content?: string }[] | undefined;
      const allEmpty = !comps || comps.every((t) => !t.content || (typeof t.content === "string" && !t.content.trim()));
      return allEmpty;
    }
    case 1: { // ActionRow
      const buttons = c.components as unknown[] | undefined;
      return !buttons || buttons.length === 0;
    }
    case 17: { // Container
      const children = c.components as Record<string, unknown>[] | undefined;
      return !children || children.length === 0;
    }
    case 13: { // File
      const file = c.file as { url?: string } | undefined;
      return !file?.url;
    }
    default:
      return false;
  }
}

function stripEmptyComponents(components: Record<string, unknown>[]): Record<string, unknown>[] {
  return components
    .map((c) => {
      // Recursively strip empty children from containers
      if (c.type === 17 && Array.isArray(c.components)) {
        return { ...c, components: stripEmptyComponents(c.components as Record<string, unknown>[]) };
      }
      return c;
    })
    .filter((c) => !isEmptyComponent(c));
}

// --- Build Payload ---

export function buildClassicPayload(
  content: string,
  embeds: DiscordEmbed[],
  webhook: WebhookConfig
) {
  const payload: Record<string, unknown> = {};

  if (content) payload.content = content;
  if (embeds.length > 0) {
    const cleaned = embeds.filter((e) => !e.hidden).map(cleanEmbed).filter((e) => Object.keys(e).length > 0);
    if (cleaned.length > 0) payload.embeds = cleaned;
  }
  payload.username = webhook.username || "embed.cat";
  payload.avatar_url = webhook.avatar_url || EMBEDCAT_LOGO_URL;

  return payload;
}

export function buildComponentsV2Payload(
  components: TopLevelComponent[],
  webhook: WebhookConfig
) {
  const cleaned = stripEmptyComponents(
    components.filter((c) => !c.hidden).map(cleanComponent)
  );
  const payload: Record<string, unknown> = {
    flags: IS_COMPONENTS_V2,
    components: cleaned,
  };

  payload.username = webhook.username || "embed.cat";
  payload.avatar_url = webhook.avatar_url || EMBEDCAT_LOGO_URL;

  return payload;
}

function injectActions(
  obj: Record<string, unknown>,
  actionsMap: Record<string, ButtonActionConfig>
): Record<string, unknown> {
  if (obj.type === 2 && obj.style !== 5 && typeof obj.custom_id === "string") {
    const cfg = actionsMap[obj.custom_id];
    if (cfg?.actions?.length) {
      return {
        ...obj,
        _actions: cfg.actions.map((a) => ({ type: a.type, config: a.config })),
      };
    }
  }
  const result = { ...obj };
  if (Array.isArray(result.components)) {
    result.components = (result.components as Record<string, unknown>[]).map(
      (c) => injectActions(c, actionsMap)
    );
  }
  return result;
}

export function buildComponentsV2WithActions(
  components: TopLevelComponent[],
  webhook: WebhookConfig,
  actionsMap: Record<string, ButtonActionConfig>
): Record<string, unknown> {
  const base = buildComponentsV2Payload(components, webhook);
  if (!actionsMap || Object.keys(actionsMap).length === 0) return base;
  const comps = base.components as Record<string, unknown>[];
  return {
    ...base,
    components: comps.map((c) => injectActions(c, actionsMap)),
  };
}

export function extractActionsFromPayload(
  payload: Record<string, unknown>
): Record<string, ActionItem[]> {
  const result: Record<string, ActionItem[]> = {};
  const walk = (obj: Record<string, unknown>) => {
    if (
      obj.type === 2 &&
      typeof obj.custom_id === "string" &&
      Array.isArray(obj._actions)
    ) {
      result[obj.custom_id] = (obj._actions as { type: string; config: Record<string, unknown> }[]).map(
        (a, i) => ({ id: `imported_${i}_${Math.random().toString(36).slice(2, 8)}`, type: a.type, config: a.config ?? {} })
      );
    }
    if (Array.isArray(obj.components)) {
      (obj.components as Record<string, unknown>[]).forEach(walk);
    }
  };
  if (Array.isArray(payload.components)) {
    (payload.components as Record<string, unknown>[]).forEach(walk);
  }
  return result;
}

// --- Nadeko format ---

export function buildNadekoPayload(content: string, embeds: DiscordEmbed[]) {
  const embed = embeds[0];
  if (!embed && !content) return {};
  const result: Record<string, unknown> = {};
  if (content) result.plainText = content;
  if (embed) {
    if (embed.title) result.title = embed.title;
    if (embed.description) result.description = embed.description;
    if (embed.url) result.url = embed.url;
    if (embed.color !== undefined) result.color = embed.color;
    if (embed.author?.name) {
      result.author = { name: embed.author.name };
      if (embed.author.icon_url) (result.author as Record<string, unknown>).icon_url = embed.author.icon_url;
      if (embed.author.url) (result.author as Record<string, unknown>).url = embed.author.url;
    }
    if (embed.footer?.text) {
      result.footer = { text: embed.footer.text };
      if (embed.footer.icon_url) (result.footer as Record<string, unknown>).icon_url = embed.footer.icon_url;
    }
    if (embed.thumbnail?.url) result.thumbnail = embed.thumbnail.url;
    if (embed.image?.url) result.image = embed.image.url;
    if (embed.fields.length > 0) {
      result.fields = embed.fields.map((f) => ({
        name: f.name,
        value: f.value,
        inline: f.inline ?? false,
      }));
    }
  }
  return result;
}

export function buildDiscohookPayload(content: string, embeds: DiscordEmbed[]) {
  const result: Record<string, unknown> = {};
  if (content) result.content = content;
  const cleaned = embeds.map(cleanEmbed).filter((e) => Object.keys(e).length > 0);
  result.embeds = cleaned.length > 0 ? cleaned : [];
  result.components = [];
  return result;
}

// --- Send via Webhook ---

export async function sendWebhookMessage(
  webhook: WebhookConfig,
  payload: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const webhookRegex = /^https:\/\/(canary\.|ptb\.)?discord\.com\/api\/webhooks\/\d+\/.+$/;
  if (!webhookRegex.test(webhook.url)) {
    return { success: false, error: "Invalid webhook URL" };
  }

  if (!payload.username) {
    payload.username = "embed.cat";
  }

  try {
    const res = await fetch("/api/webhook/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        webhookUrl: webhook.url,
        threadId: webhook.thread_id,
        payload,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: (data as { error?: string }).error || `HTTP ${res.status}`,
      };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

export function hasNonLinkButtons(components: TopLevelComponent[]): boolean {
  for (const c of components) {
    if (c.type === 1) {
      const ar = c as ActionRowComponent;
      if (ar.components.some((b) => b.style !== ButtonStyle.Link)) return true;
    }
    if (c.type === 17) {
      const ct = c as ContainerComponent;
      for (const child of ct.components) {
        if (child.type === 1) {
          const ar = child as ActionRowComponent;
          if (ar.components.some((b) => b.style !== ButtonStyle.Link)) return true;
        }
      }
    }
  }
  return false;
}

function collectNonLinkButtons(components: TopLevelComponent[]): ButtonComponent[] {
  const buttons: ButtonComponent[] = [];
  for (const c of components) {
    if (c.type === 1) {
      const ar = c as ActionRowComponent;
      buttons.push(...ar.components.filter((b) => b.style !== ButtonStyle.Link));
    }
    if (c.type === 17) {
      const ct = c as ContainerComponent;
      for (const child of ct.components) {
        if (child.type === 1) {
          const ar = child as ActionRowComponent;
          buttons.push(...ar.components.filter((b) => b.style !== ButtonStyle.Link));
        }
      }
    }
  }
  return buttons;
}

export async function sendBotMessage(
  channelId: string,
  guildId: string,
  payload: Record<string, unknown>,
  components: TopLevelComponent[],
  buttonActionsMap: Record<string, ButtonActionConfig>,
  embedId?: string,
): Promise<{ success: boolean; error?: string }> {
  const nonLinkButtons = collectNonLinkButtons(components);

  const buttonActions = nonLinkButtons.map((b) => {
    const buttonId = b.custom_id || `btn_${b.id || Math.random().toString(36).slice(2, 10)}`;
    return {
      buttonId,
      label: b.label ?? "",
      style: b.style,
      actions: (buttonActionsMap[buttonId]?.actions ?? buttonActionsMap[b.custom_id || ""]?.actions ?? []).map((a, i) => ({
        order: i,
        type: a.type,
        config: a.config,
      })),
    };
  });

  const botPayload: Record<string, unknown> = { ...payload };
  delete botPayload.username;
  delete botPayload.avatar_url;

  try {
    const res = await fetch("/api/bot/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channelId,
        guildId,
        payload: botPayload,
        buttonActions,
        embedId,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: (data as { error?: string }).error || `HTTP ${res.status}`,
      };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}
