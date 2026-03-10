"use client";

import { useCallback } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import { usePersistedCollapse } from "@/hooks/use-persisted-collapse";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Copy,
  GripVertical,
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
import { MarkdownTextarea } from "./MarkdownTextarea";
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
import { useDragReorder } from "@/hooks/use-drag-reorder";

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
  dragProps,
  gripProps,
}: {
  embedId: string;
  field: EmbedField;
  index: number;
  total: number;
  dragProps: Record<string, unknown>;
  gripProps: Record<string, unknown>;
}) {
  const { updateField, removeField, moveField } = useBuilderStore();
  const { t } = useLocale();

  return (
    <div className="rounded bg-white/[0.02] border border-white/[0.04] p-1.5 space-y-1" {...dragProps}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <GripVertical {...gripProps} className="size-3 text-[#3f3f46] cursor-grab active:cursor-grabbing touch-none" />
          <span className="text-[10px] font-medium text-muted-foreground">
            {t.embed.field} {index + 1}
          </span>
        </div>
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
          <Label className="text-[10px] text-muted-foreground">{t.embed.fieldName}</Label>
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
          placeholder={t.embed.fieldNamePlaceholder}
          maxLength={LIMITS.EMBED_FIELD_NAME}
          className="h-7 text-xs"
        />
      </div>

      <div className="space-y-0.5">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] text-muted-foreground">{t.embed.fieldValue}</Label>
          <CharCount
            current={field.value.length}
            max={LIMITS.EMBED_FIELD_VALUE}
          />
        </div>
        <MarkdownTextarea
          value={field.value}
          onValueChange={(v) =>
            updateField(embedId, field.id, { value: v })
          }
          placeholder={t.embed.fieldValuePlaceholder}
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
          {t.embed.inline}
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
    reorderFields,
  } = useBuilderStore();
  const { t } = useLocale();

  const { getDragProps: getFieldDragProps, getGripProps: getFieldGripProps, getContainerProps: getFieldContainerProps } = useDragReorder(
    useCallback((from: number, to: number) => reorderFields(embed.id, from, to), [embed.id, reorderFields])
  );

  const [authorCollapsed, toggleAuthor] = usePersistedCollapse(`${embed.id}-author`, true);
  const [bodyCollapsed, toggleBody] = usePersistedCollapse(`${embed.id}-body`, false);
  const [fieldsCollapsed, toggleFields] = usePersistedCollapse(`${embed.id}-fields`, embed.fields.length === 0);
  const [imagesCollapsed, toggleImages] = usePersistedCollapse(`${embed.id}-images`, true);
  const [footerCollapsed, toggleFooter] = usePersistedCollapse(`${embed.id}-footer`, true);

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
        <Collapsible open={!authorCollapsed} onOpenChange={toggleAuthor}>
          <CollapsibleTrigger className="w-full">
            <SectionHeader
              icon={<User className="size-3" />}
              label={t.embed.author}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-2 pb-2 space-y-1">
              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] text-muted-foreground">{t.embed.authorName}</Label>
                  <CharCount
                    current={embed.author?.name?.length ?? 0}
                    max={LIMITS.EMBED_AUTHOR_NAME}
                  />
                </div>
                <Input
                  value={embed.author?.name ?? ""}
                  onChange={(e) => setAuthor("name", e.target.value)}
                  placeholder={t.embed.authorName}
                  maxLength={LIMITS.EMBED_AUTHOR_NAME}
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-0.5">
                <Label className="text-[10px] text-muted-foreground">{t.embed.authorUrl}</Label>
                <Input
                  value={embed.author?.url ?? ""}
                  onChange={(e) => setAuthor("url", e.target.value)}
                  placeholder="https://"
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-0.5">
                <Label className="text-[10px] text-muted-foreground">{t.embed.authorIconUrl}</Label>
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

        <Collapsible open={!bodyCollapsed} onOpenChange={toggleBody}>
          <CollapsibleTrigger className="w-full">
            <SectionHeader
              icon={<Type className="size-3" />}
              label={t.embed.body}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-2 pb-2 pt-1 space-y-1">
              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] text-muted-foreground">{t.embed.title}</Label>
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
                  placeholder={t.embed.title}
                  maxLength={LIMITS.EMBED_TITLE}
                  className="h-7 text-xs"
                />
              </div>

              <div className="space-y-0.5">
                <Label className="text-[10px] text-muted-foreground">{t.embed.titleUrl}</Label>
                <Input
                  value={embed.url ?? ""}
                  onChange={(e) => updateEmbed(embed.id, { url: e.target.value })}
                  placeholder="https://"
                  className="h-7 text-xs"
                />
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] text-muted-foreground">{t.embed.description}</Label>
                  <CharCount
                    current={embed.description?.length ?? 0}
                    max={LIMITS.EMBED_DESCRIPTION}
                  />
                </div>
                <MarkdownTextarea
                  value={embed.description ?? ""}
                  onValueChange={(v) =>
                    updateEmbed(embed.id, { description: v })
                  }
                  placeholder={t.embed.descriptionPlaceholder}
                  maxLength={LIMITS.EMBED_DESCRIPTION}
                  className="text-xs min-h-[56px]"
                />
              </div>

              <div className="space-y-0.5">
                <Label className="text-[10px] text-muted-foreground">{t.embed.color}</Label>
                <ColorPicker
                  color={embed.color ?? 0x5865f2}
                  onChange={(color) => updateEmbed(embed.id, { color })}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="border-t border-white/[0.04]" />

        <Collapsible open={!fieldsCollapsed} onOpenChange={toggleFields}>
          <CollapsibleTrigger className="w-full">
            <SectionHeader
              icon={<LayoutGrid className="size-3" />}
              label={`${t.embed.fields} (${embed.fields.length}/${LIMITS.EMBED_FIELDS})`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-2 pb-2 space-y-1">
              <div className="space-y-1" {...getFieldContainerProps()}>
                {embed.fields.map((field, i) => (
                  <FieldEditor
                    key={field.id}
                    embedId={embed.id}
                    field={field}
                    index={i}
                    total={embed.fields.length}
                    dragProps={getFieldDragProps(i)}
                    gripProps={getFieldGripProps(i)}
                  />
                ))}
              </div>
              {embed.fields.length < LIMITS.EMBED_FIELDS && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addField(embed.id)}
                  className="h-6 w-full border-dashed text-[10px] text-muted-foreground hover:text-foreground hover:border-foreground/30 bg-transparent"
                >
                  <Plus className="size-3" />
                  {t.embed.addField}
                </Button>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="border-t border-white/[0.04]" />

        <Collapsible open={!imagesCollapsed} onOpenChange={toggleImages}>
          <CollapsibleTrigger className="w-full">
            <SectionHeader
              icon={<ImageIcon className="size-3" />}
              label={t.embed.images}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-2 pb-2 space-y-1">
              <div className="space-y-0.5">
                <Label className="text-[10px] text-muted-foreground">{t.embed.imageUrl}</Label>
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
                <Label className="text-[10px] text-muted-foreground">{t.embed.thumbnailUrl}</Label>
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

        <Collapsible open={!footerCollapsed} onOpenChange={toggleFooter}>
          <CollapsibleTrigger className="w-full">
            <SectionHeader
              icon={<MessageSquare className="size-3" />}
              label={t.embed.footer}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-2 pb-2 space-y-1">
              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] text-muted-foreground">{t.embed.footerText}</Label>
                  <CharCount
                    current={embed.footer?.text?.length ?? 0}
                    max={LIMITS.EMBED_FOOTER_TEXT}
                  />
                </div>
                <Input
                  value={embed.footer?.text ?? ""}
                  onChange={(e) => setFooter("text", e.target.value)}
                  placeholder={t.embed.footerTextPlaceholder}
                  maxLength={LIMITS.EMBED_FOOTER_TEXT}
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-0.5">
                <Label className="text-[10px] text-muted-foreground">{t.embed.footerIconUrl}</Label>
                <Input
                  value={embed.footer?.icon_url ?? ""}
                  onChange={(e) => setFooter("icon_url", e.target.value)}
                  placeholder="https://"
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-0.5">
                <Label className="text-[10px] text-muted-foreground">{t.embed.timestamp}</Label>
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
