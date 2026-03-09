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

// --- Send via Webhook ---

export async function sendWebhookMessage(
  webhook: WebhookConfig,
  payload: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  // Validate webhook URL
  const webhookRegex = /^https:\/\/(canary\.|ptb\.)?discord\.com\/api\/webhooks\/\d+\/.+$/;
  if (!webhookRegex.test(webhook.url)) {
    return { success: false, error: "Invalid webhook URL" };
  }

  // Apply embed.cat branding defaults
  if (!payload.username) {
    payload.username = "embed.cat";
  }

  const isV2 = (payload.flags as number) === IS_COMPONENTS_V2;
  const url = new URL(webhook.url);
  url.searchParams.set("wait", "true");
  if (isV2) {
    url.searchParams.set("with_components", "true");
  }
  if (webhook.thread_id) {
    url.searchParams.set("thread_id", webhook.thread_id);
  }

  try {
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      return {
        success: false,
        error: (err as { message?: string }).message || `HTTP ${res.status}`,
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
