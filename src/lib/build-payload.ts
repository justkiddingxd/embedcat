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
import { IS_COMPONENTS_V2 } from "@/types/discord";

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
  if (clean.url) result.url = clean.url;
  if (clean.custom_id) result.custom_id = clean.custom_id;
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
        components: ct.components.map(cleanComponent),
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

// --- Build Payload ---

export function buildClassicPayload(
  content: string,
  embeds: DiscordEmbed[],
  webhook: WebhookConfig
) {
  const payload: Record<string, unknown> = {};

  if (content) payload.content = content;
  if (embeds.length > 0) {
    const cleaned = embeds.map(cleanEmbed).filter((e) => Object.keys(e).length > 0);
    if (cleaned.length > 0) payload.embeds = cleaned;
  }
  if (webhook.username) payload.username = webhook.username;
  if (webhook.avatar_url) payload.avatar_url = webhook.avatar_url;

  return payload;
}

export function buildComponentsV2Payload(
  components: TopLevelComponent[],
  webhook: WebhookConfig
) {
  const payload: Record<string, unknown> = {
    flags: IS_COMPONENTS_V2,
    components: components.map(cleanComponent),
  };

  if (webhook.username) payload.username = webhook.username;
  if (webhook.avatar_url) payload.avatar_url = webhook.avatar_url;

  return payload;
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
