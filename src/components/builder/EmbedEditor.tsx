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
import { ColorPicker } from "./ColorPicker";
import { DateTimePicker } from "./DateTimePicker";

function CharCount({ current, max }: { current: number; max: number }) {
  const ratio = current / max;
  return (
    <span
      className={`text-[10px] tabular-nums font-mono ${
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


function SectionHeader({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="group flex items-center gap-1.5 py-1.5 px-2 bg-white/[0.03] hover:bg-white/[0.05] transition-colors cursor-pointer select-none">
      <span className="text-[#71717a]">{icon}</span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] flex-1 text-[#a1a1aa]">
        {label}
      </span>
      <ChevronDown className="size-3 text-[#52525b] transition-transform duration-200 group-aria-expanded:rotate-180" />
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
    <div className="rounded bg-white/[0.02] border border-white/[0.04] p-1.5 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-muted-foreground">
          Field {index + 1}
        </span>
        <div className="flex items-center gap-0">
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

      <div className="space-y-0.5">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] text-muted-foreground">Name</Label>
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
          className="h-7 text-xs"
        />
      </div>

      <div className="space-y-0.5">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] text-muted-foreground">Value</Label>
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
          placeholder="Field value"
          maxLength={LIMITS.EMBED_FIELD_VALUE}
          className="text-xs min-h-[40px]"
        />
      </div>

      <div className="flex items-center gap-1.5">
        <Switch
          size="sm"
          checked={field.inline ?? false}
          onCheckedChange={(val) =>
            updateField(embedId, field.id, { inline: val })
          }
          className="data-checked:bg-[#5865f2]"
        />
        <Label className="text-[10px] text-muted-foreground cursor-pointer">
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
      className="bg-[#111113] overflow-hidden"
      style={{ borderLeft: `3px solid ${colorHex}` }}
    >
      {showHeader && (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-white/[0.02] border-b border-white/[0.06]">
          <span className="text-xs font-semibold text-foreground flex-1">
            Embed {embedIndex + 1}
          </span>
          <div className="flex items-center gap-0">
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
              icon={<User className="size-3" />}
              label="Author"
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-2 pb-2 space-y-1">
              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] text-muted-foreground">Name</Label>
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
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-0.5">
                <Label className="text-[10px] text-muted-foreground">URL</Label>
                <Input
                  value={embed.author?.url ?? ""}
                  onChange={(e) => setAuthor("url", e.target.value)}
                  placeholder="https://"
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-0.5">
                <Label className="text-[10px] text-muted-foreground">Icon URL</Label>
                <Input
                  value={embed.author?.icon_url ?? ""}
                  onChange={(e) => setAuthor("icon_url", e.target.value)}
                  placeholder="https://"
                  className="h-7 text-xs"
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="border-t border-white/[0.04]" />

        <div className="flex items-center gap-1.5 py-1.5 px-2 bg-white/[0.03]">
          <Type className="size-3 text-[#71717a]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] flex-1 text-center text-[#a1a1aa]">
            Body
          </span>
          <div className="size-3" />
        </div>
        <div className="px-2 py-1.5 space-y-1">

          <div className="space-y-0.5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-muted-foreground">Title</Label>
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
              className="h-7 text-xs"
            />
          </div>

          <div className="space-y-0.5">
            <Label className="text-[10px] text-muted-foreground">Title URL</Label>
            <Input
              value={embed.url ?? ""}
              onChange={(e) => updateEmbed(embed.id, { url: e.target.value })}
              placeholder="https://"
              className="h-7 text-xs"
            />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-muted-foreground">Description</Label>
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
              placeholder="Supports markdown"
              maxLength={LIMITS.EMBED_DESCRIPTION}
              className="text-xs min-h-[56px]"
            />
          </div>

          <div className="space-y-0.5">
            <Label className="text-[10px] text-muted-foreground">Color</Label>
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
              icon={<LayoutGrid className="size-3" />}
              label={`Fields (${embed.fields.length}/${LIMITS.EMBED_FIELDS})`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-2 pb-2 space-y-1">
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
                  className="h-6 w-full border-dashed text-[10px] text-muted-foreground hover:text-foreground hover:border-foreground/30 bg-transparent"
                >
                  <Plus className="size-3" />
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
              icon={<ImageIcon className="size-3" />}
              label="Images"
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-2 pb-2 space-y-1">
              <div className="space-y-0.5">
                <Label className="text-[10px] text-muted-foreground">Image URL</Label>
                <Input
                  value={embed.image?.url ?? ""}
                  onChange={(e) =>
                    updateEmbed(embed.id, { image: { url: e.target.value } })
                  }
                  placeholder="https://"
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-0.5">
                <Label className="text-[10px] text-muted-foreground">Thumbnail URL</Label>
                <Input
                  value={embed.thumbnail?.url ?? ""}
                  onChange={(e) =>
                    updateEmbed(embed.id, {
                      thumbnail: { url: e.target.value },
                    })
                  }
                  placeholder="https://"
                  className="h-7 text-xs"
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="border-t border-white/[0.04]" />

        <Collapsible defaultOpen={false}>
          <CollapsibleTrigger className="w-full">
            <SectionHeader
              icon={<MessageSquare className="size-3" />}
              label="Footer"
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-2 pb-2 space-y-1">
              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] text-muted-foreground">Text</Label>
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
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-0.5">
                <Label className="text-[10px] text-muted-foreground">Icon URL</Label>
                <Input
                  value={embed.footer?.icon_url ?? ""}
                  onChange={(e) => setFooter("icon_url", e.target.value)}
                  placeholder="https://"
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-0.5">
                <Label className="text-[10px] text-muted-foreground">Timestamp</Label>
                <DateTimePicker
                  value={embed.timestamp}
                  onChange={(iso) => updateEmbed(embed.id, { timestamp: iso })}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
