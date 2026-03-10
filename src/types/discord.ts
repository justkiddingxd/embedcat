// ============================================================
// Discord API Types for embed.cat
// ============================================================

// --- Classic Embed Types ---

export interface EmbedAuthor {
  name: string;
  url?: string;
  icon_url?: string;
}

export interface EmbedFooter {
  text: string;
  icon_url?: string;
}

export interface EmbedField {
  id: string; // internal ID for React keys
  name: string;
  value: string;
  inline?: boolean;
}

export interface EmbedImage {
  url: string;
}

export interface EmbedThumbnail {
  url: string;
}

export interface DiscordEmbed {
  id: string;
  hidden?: boolean;
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  timestamp?: string;
  author?: EmbedAuthor;
  footer?: EmbedFooter;
  image?: EmbedImage;
  thumbnail?: EmbedThumbnail;
  fields: EmbedField[];
}

// --- Components V2 Types ---

export enum ComponentType {
  ActionRow = 1,
  Button = 2,
  StringSelect = 3,
  TextInput = 4,
  UserSelect = 5,
  RoleSelect = 6,
  MentionableSelect = 7,
  ChannelSelect = 8,
  Section = 9,
  TextDisplay = 10,
  Thumbnail = 11,
  MediaGallery = 12,
  File = 13,
  Separator = 14,
  Container = 17,
}

export enum ButtonStyle {
  Primary = 1,
  Secondary = 2,
  Success = 3,
  Danger = 4,
  Link = 5,
}

export interface ButtonComponent {
  id: string;
  hidden?: boolean;
  type: ComponentType.Button;
  style: ButtonStyle;
  label?: string;
  emoji?: { name: string; id?: string };
  custom_id?: string;
  url?: string;
  disabled?: boolean;
}

export interface ActionRowComponent {
  id: string;
  hidden?: boolean;
  type: ComponentType.ActionRow;
  components: ButtonComponent[];
}

export interface TextDisplayComponent {
  id: string;
  hidden?: boolean;
  type: ComponentType.TextDisplay;
  content: string;
}

export interface UnfurledMediaItem {
  url: string;
}

export interface ThumbnailComponent {
  id: string;
  type: ComponentType.Thumbnail;
  media: UnfurledMediaItem;
  description?: string;
  spoiler?: boolean;
}

export interface MediaGalleryItem {
  id: string;
  media: UnfurledMediaItem;
  description?: string;
  spoiler?: boolean;
}

export interface MediaGalleryComponent {
  id: string;
  hidden?: boolean;
  type: ComponentType.MediaGallery;
  items: MediaGalleryItem[];
}

export interface FileComponent {
  id: string;
  hidden?: boolean;
  type: ComponentType.File;
  file: UnfurledMediaItem;
  spoiler?: boolean;
}

export interface SeparatorComponent {
  id: string;
  hidden?: boolean;
  type: ComponentType.Separator;
  divider: boolean;
  spacing: 1 | 2; // 1 = small, 2 = large
}

export interface SectionComponent {
  id: string;
  hidden?: boolean;
  type: ComponentType.Section;
  components: TextDisplayComponent[];
  accessory?: ButtonComponent | ThumbnailComponent;
}

export type ContainerChild =
  | ActionRowComponent
  | TextDisplayComponent
  | SectionComponent
  | MediaGalleryComponent
  | FileComponent
  | SeparatorComponent;

export interface ContainerComponent {
  id: string;
  hidden?: boolean;
  type: ComponentType.Container;
  accent_color?: number;
  spoiler?: boolean;
  components: ContainerChild[];
}

export type TopLevelComponent =
  | ContainerComponent
  | ActionRowComponent
  | TextDisplayComponent
  | SectionComponent
  | MediaGalleryComponent
  | SeparatorComponent;

// --- Message Types ---

export type BuilderMode = "classic" | "components_v2";

export interface WebhookConfig {
  url: string;
  username?: string;
  avatar_url?: string;
  thread_id?: string;
}

export interface ClassicMessage {
  content: string;
  embeds: DiscordEmbed[];
}

export interface ComponentsV2Message {
  components: TopLevelComponent[];
}

// --- Discord Embed Limits ---

export const LIMITS = {
  CONTENT: 2000,
  EMBEDS_PER_MESSAGE: 10,
  EMBED_TITLE: 256,
  EMBED_DESCRIPTION: 4096,
  EMBED_AUTHOR_NAME: 256,
  EMBED_FOOTER_TEXT: 2048,
  EMBED_FIELDS: 25,
  EMBED_FIELD_NAME: 256,
  EMBED_FIELD_VALUE: 1024,
  EMBED_TOTAL_CHARS: 6000,
  WEBHOOK_USERNAME: 80,
  COMPONENTS_MAX: 40,
  SECTION_TEXT_COMPONENTS: 3,
  MEDIA_GALLERY_ITEMS: 10,
  ACTION_ROW_BUTTONS: 5,
} as const;

// Flag for Components V2
export const IS_COMPONENTS_V2 = 1 << 15; // 32768
export const SUPPRESS_EMBEDS = 1 << 2;
export const SUPPRESS_NOTIFICATIONS = 1 << 12;
