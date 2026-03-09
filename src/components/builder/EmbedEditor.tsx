"use client";

import { useCallback } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Copy,
  ImageIcon,
  LayoutGrid,
  MessageSquare,
  Plus,
  Trash2,
  Type,
  User,
} from "lucide-react";
import { useBuilderStore } from "@/store/builder-store";
import { LIMITS } from "@/types/discord";
import type { DiscordEmbed, EmbedField } from "@/types/discord";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

function CharCount({ current, max }: { current: number; max: number }) {
  const ratio = current / max;
  return (
    <span
      className={`text-[11px] tabular-nums font-mono ${
        current > max
          ? "text-destructive"
          : ratio > 0.9
            ? "text-destructive/80"
            : "text-muted-foreground"
      }`}
    >
      {current}/{max}
    </span>
  );
}

function ColorPicker({
  color,
  onChange,
}: {
  color: number;
  onChange: (color: number) => void;
}) {
  const hexValue = `#${color.toString(16).padStart(6, "0")}`;

  const handleHexInput = useCallback(
    (value: string) => {
      const cleaned = value.replace(/[^0-9a-fA-F#]/g, "");
      const hex = cleaned.startsWith("#") ? cleaned.slice(1) : cleaned;
      if (hex.length === 6) {
        const parsed = parseInt(hex, 16);
        if (!isNaN(parsed)) onChange(parsed);
      }
    },
    [onChange]
  );

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <input
          type="color"
          value={hexValue}
          onChange={(e) => {
            const parsed = parseInt(e.target.value.slice(1), 16);
            onChange(parsed);
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      <div
        className="w-7 h-7 rounded-md border border-border cursor-pointer shadow-sm"
          style={{ backgroundColor: hexValue }}
        />
      </div>
      <Input
        value={hexValue}
        onChange={(e) => handleHexInput(e.target.value)}
        className="w-28 font-mono text-xs"
        maxLength={7}
      />
    </div>
  );
}

function SectionHeader({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="group flex items-center gap-2 py-1.5 px-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none">
      <span className="text-muted-foreground/60">{icon}</span>
      <span className="text-[10px] font-medium uppercase tracking-[0.08em] flex-1">
        {label}
      </span>
      <ChevronDown className="size-3.5 text-muted-foreground/60 transition-transform duration-200 group-aria-expanded:rotate-180" />
    </div>
  );
}

function FieldEditor({
  embedId,
  field,
  index,
  total,
}: {
  embedId: string;
  field: EmbedField;
  index: number;
  total: number;
}) {
  const { updateField, removeField, moveField } = useBuilderStore();

  return (
    <div className="rounded-md bg-white/[0.02] border border-white/[0.04] p-2 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Field {index + 1}
        </span>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => moveField(embedId, field.id, "up")}
            disabled={index === 0}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronUp className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => moveField(embedId, field.id, "down")}
            disabled={index === total - 1}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronDown className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => removeField(embedId, field.id)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Name</Label>
          <CharCount
            current={field.name.length}
            max={LIMITS.EMBED_FIELD_NAME}
          />
        </div>
        <Input
          value={field.name}
          onChange={(e) =>
            updateField(embedId, field.id, { name: e.target.value })
          }
          placeholder="Field name"
          maxLength={LIMITS.EMBED_FIELD_NAME}
          className="text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Value</Label>
          <CharCount
            current={field.value.length}
            max={LIMITS.EMBED_FIELD_VALUE}
          />
        </div>
        <Textarea
          value={field.value}
          onChange={(e) =>
            updateField(embedId, field.id, { value: e.target.value })
          }
          placeholder="Field value — supports markdown"
          maxLength={LIMITS.EMBED_FIELD_VALUE}
          className="text-sm min-h-[60px]"
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch
          size="sm"
          checked={field.inline ?? false}
          onCheckedChange={(val) =>
            updateField(embedId, field.id, { inline: val })
          }
          className="data-checked:bg-[#5865f2]"
        />
        <Label className="text-xs text-muted-foreground cursor-pointer">
          Inline
        </Label>
      </div>
    </div>
  );
}

interface EmbedEditorProps {
  embed: DiscordEmbed;
  embedIndex?: number;
}

export function EmbedEditor({ embed, embedIndex }: EmbedEditorProps) {
  const {
    embeds,
    updateEmbed,
    removeEmbed,
    duplicateEmbed,
    moveEmbed,
    addField,
  } = useBuilderStore();

  const totalEmbeds = embeds.length;
  const colorHex = `#${(embed.color ?? 0x5865f2).toString(16).padStart(6, "0")}`;
  const showHeader = embedIndex !== undefined;

  const setAuthor = useCallback(
    (key: "name" | "url" | "icon_url", value: string) => {
      const current = embed.author ?? { name: "" };
      updateEmbed(embed.id, { author: { ...current, [key]: value } });
    },
    [embed.id, embed.author, updateEmbed]
  );

  const setFooter = useCallback(
    (key: "text" | "icon_url", value: string) => {
      const current = embed.footer ?? { text: "" };
      updateEmbed(embed.id, { footer: { ...current, [key]: value } });
    },
    [embed.id, embed.footer, updateEmbed]
  );

  return (
    <div
      className="rounded-lg bg-[#111113] border border-white/[0.06] overflow-hidden"
      style={{ borderLeft: `4px solid ${colorHex}` }}
    >
      {showHeader && (
        <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] border-b border-white/[0.06]">
          <span className="text-sm font-semibold text-foreground flex-1">
            Embed {embedIndex + 1}
          </span>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => moveEmbed(embed.id, "up")}
              disabled={embedIndex === 0}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowUp className="size-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => moveEmbed(embed.id, "down")}
              disabled={embedIndex === totalEmbeds - 1}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowDown className="size-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => duplicateEmbed(embed.id)}
              disabled={totalEmbeds >= LIMITS.EMBEDS_PER_MESSAGE}
              className="text-muted-foreground hover:text-foreground"
            >
              <Copy className="size-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => removeEmbed(embed.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-0">
        <Collapsible defaultOpen={false}>
          <CollapsibleTrigger className="w-full">
            <SectionHeader
              icon={<User className="size-3.5" />}
              label="Author"
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-3 pb-2 space-y-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">
                    Author Name
                  </Label>
                  <CharCount
                    current={embed.author?.name?.length ?? 0}
                    max={LIMITS.EMBED_AUTHOR_NAME}
                  />
                </div>
                <Input
                  value={embed.author?.name ?? ""}
                  onChange={(e) => setAuthor("name", e.target.value)}
                  placeholder="Author name"
                  maxLength={LIMITS.EMBED_AUTHOR_NAME}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Author URL
                </Label>
                <Input
                  value={embed.author?.url ?? ""}
                  onChange={(e) => setAuthor("url", e.target.value)}
                  placeholder="https://"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Author Icon URL
                </Label>
                <Input
                  value={embed.author?.icon_url ?? ""}
                  onChange={(e) => setAuthor("icon_url", e.target.value)}
                  placeholder="https://"
                  className="text-sm"
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="border-t border-white/[0.04]" />

        <div className="px-3 py-2 space-y-2">
          <div className="flex items-center gap-2 pb-0.5">
            <Type className="size-3.5 text-muted-foreground/60" />
            <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Body
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Title</Label>
              <CharCount
                current={embed.title?.length ?? 0}
                max={LIMITS.EMBED_TITLE}
              />
            </div>
            <Input
              value={embed.title ?? ""}
              onChange={(e) =>
                updateEmbed(embed.id, { title: e.target.value })
              }
              placeholder="Embed title"
              maxLength={LIMITS.EMBED_TITLE}
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Title URL</Label>
            <Input
              value={embed.url ?? ""}
              onChange={(e) => updateEmbed(embed.id, { url: e.target.value })}
              placeholder="https://"
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Description
              </Label>
              <CharCount
                current={embed.description?.length ?? 0}
                max={LIMITS.EMBED_DESCRIPTION}
              />
            </div>
            <Textarea
              value={embed.description ?? ""}
              onChange={(e) =>
                updateEmbed(embed.id, { description: e.target.value })
              }
              placeholder="Embed description — supports markdown"
              maxLength={LIMITS.EMBED_DESCRIPTION}
              className="text-sm min-h-[80px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Color</Label>
            <ColorPicker
              color={embed.color ?? 0x5865f2}
              onChange={(color) => updateEmbed(embed.id, { color })}
            />
          </div>
        </div>

        <div className="border-t border-white/[0.04]" />

        <Collapsible defaultOpen={embed.fields.length > 0}>
          <CollapsibleTrigger className="w-full">
            <SectionHeader
              icon={<LayoutGrid className="size-3.5" />}
              label={`Fields (${embed.fields.length}/${LIMITS.EMBED_FIELDS})`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-3 pb-2 space-y-1.5">
              {embed.fields.map((field, i) => (
                <FieldEditor
                  key={field.id}
                  embedId={embed.id}
                  field={field}
                  index={i}
                  total={embed.fields.length}
                />
              ))}
              {embed.fields.length < LIMITS.EMBED_FIELDS && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addField(embed.id)}
                  className="w-full border-dashed text-muted-foreground hover:text-foreground hover:border-foreground/30 bg-transparent"
                >
                  <Plus className="size-3.5" />
                  Add Field
                </Button>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="border-t border-white/[0.04]" />

        <Collapsible defaultOpen={false}>
          <CollapsibleTrigger className="w-full">
            <SectionHeader
              icon={<ImageIcon className="size-3.5" />}
              label="Images"
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-3 pb-2 space-y-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Image URL
                </Label>
                <Input
                  value={embed.image?.url ?? ""}
                  onChange={(e) =>
                    updateEmbed(embed.id, { image: { url: e.target.value } })
                  }
                  placeholder="https://"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Thumbnail URL
                </Label>
                <Input
                  value={embed.thumbnail?.url ?? ""}
                  onChange={(e) =>
                    updateEmbed(embed.id, {
                      thumbnail: { url: e.target.value },
                    })
                  }
                  placeholder="https://"
                  className="text-sm"
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="border-t border-white/[0.04]" />

        <Collapsible defaultOpen={false}>
          <CollapsibleTrigger className="w-full">
            <SectionHeader
              icon={<MessageSquare className="size-3.5" />}
              label="Footer"
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-3 pb-2 space-y-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">
                    Footer Text
                  </Label>
                  <CharCount
                    current={embed.footer?.text?.length ?? 0}
                    max={LIMITS.EMBED_FOOTER_TEXT}
                  />
                </div>
                <Input
                  value={embed.footer?.text ?? ""}
                  onChange={(e) => setFooter("text", e.target.value)}
                  placeholder="Footer text"
                  maxLength={LIMITS.EMBED_FOOTER_TEXT}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Footer Icon URL
                </Label>
                <Input
                  value={embed.footer?.icon_url ?? ""}
                  onChange={(e) => setFooter("icon_url", e.target.value)}
                  placeholder="https://"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Timestamp
                </Label>
                <Input
                  type="datetime-local"
                  value={
                    embed.timestamp ? embed.timestamp.slice(0, 16) : ""
                  }
                  onChange={(e) =>
                    updateEmbed(embed.id, {
                      timestamp: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : undefined,
                    })
                  }
                  className="text-sm [color-scheme:dark]"
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
