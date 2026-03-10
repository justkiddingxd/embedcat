"use client";

import { useLocale } from "@/lib/i18n/locale-context";
import { usePersistedCollapse } from "@/hooks/use-persisted-collapse";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  GripVertical,
  Plus,
} from "lucide-react";
import { useBuilderStore } from "@/store/builder-store";
import { LIMITS } from "@/types/discord";
import { MarkdownTextarea } from "./MarkdownTextarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmbedEditor } from "./EmbedEditor";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";
import { useDragReorder } from "@/hooks/use-drag-reorder";

function EmbedCard({
  embed,
  index,
  total,
  dragProps,
  gripProps,
}: {
  embed: { id: string; title?: string; color?: number };
  index: number;
  total: number;
  dragProps: Record<string, unknown>;
  gripProps: Record<string, unknown>;
}) {
  const [collapsed, toggleCollapsed] = usePersistedCollapse(`embed-${embed.id}`, false);
  const { removeEmbed, duplicateEmbed, moveEmbed } = useBuilderStore();
  const store = useBuilderStore();
  const fullEmbed = store.embeds.find((e) => e.id === embed.id)!;

  const colorHex = `#${(embed.color ?? 0x5865f2).toString(16).padStart(6, "0")}`;
  const { t } = useLocale();
  const titlePreview = embed.title?.slice(0, 40) || t.classic.untitledEmbed;

  return (
    <div className="rounded-md bg-[#111113] border border-white/[0.06] overflow-hidden" {...dragProps}>
      <div
        className="flex items-center gap-1.5 px-2 py-1.5 cursor-pointer select-none"
        onClick={toggleCollapsed}
      >
        <div
          className="w-0.5 h-5 rounded-full shrink-0"
          style={{ backgroundColor: colorHex }}
        />
        <GripVertical {...gripProps} className="size-3 text-[#3f3f46] shrink-0 cursor-grab active:cursor-grabbing touch-none" />
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Badge
            variant="secondary"
            className="shrink-0 bg-[#18181b] text-[#71717a] border-0 text-[10px] px-1 h-4"
          >
            {index + 1}
          </Badge>
          <span className="text-xs text-[#e4e4e7] truncate">{titlePreview}</span>
        </div>
        <div className="flex items-center gap-0 shrink-0">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation();
              moveEmbed(embed.id, "up");
            }}
            disabled={index === 0}
            className="text-[#52525b] hover:text-[#a1a1aa] transition-colors"
          >
            <ChevronUp className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation();
              moveEmbed(embed.id, "down");
            }}
            disabled={index === total - 1}
            className="text-[#52525b] hover:text-[#a1a1aa] transition-colors"
          >
            <ChevronDown className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation();
              duplicateEmbed(embed.id);
            }}
            disabled={total >= LIMITS.EMBEDS_PER_MESSAGE}
            className="text-[#52525b] hover:text-[#a1a1aa] transition-colors"
          >
            <Copy className="size-3" />
          </Button>
          <ConfirmDeleteButton onConfirm={() => removeEmbed(embed.id)} />
          <ChevronDown
            className={`size-3 text-[#52525b] ml-0.5 transition-transform duration-200 ${
              collapsed ? "" : "rotate-180"
            }`}
          />
        </div>
      </div>

      {!collapsed && (
        <div className="border-t border-white/[0.06]">
          <EmbedEditor embed={fullEmbed} />
        </div>
      )}
    </div>
  );
}

export function ClassicBuilder() {
  const { content, setContent, embeds, addEmbed, reorderEmbeds } = useBuilderStore();
  const { t } = useLocale();
  const { getDragProps, getGripProps, getContainerProps } = useDragReorder(reorderEmbeds);

  return (
    <div className="space-y-1.5">
      <div className="rounded-md bg-[#111113] border border-white/[0.06] p-2 space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#a1a1aa]">
            {t.classic.content}
          </Label>
          <span
            className={`text-[10px] tabular-nums font-mono ${
              content.length > LIMITS.CONTENT
                ? "text-red-400"
                : content.length > LIMITS.CONTENT * 0.9
                  ? "text-amber-400"
                  : "text-[#3f3f46]"
            }`}
          >
            {content.length}/{LIMITS.CONTENT}
          </span>
        </div>
        <MarkdownTextarea
          value={content}
          onValueChange={setContent}
          placeholder={t.classic.contentPlaceholder}
          maxLength={LIMITS.CONTENT}
          className="bg-[#0a0a0b] border-white/[0.06] text-[#fafafa] placeholder:text-[#3f3f46] text-xs min-h-[48px]"
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between px-0.5">
          <Label className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#a1a1aa]">
            {t.classic.embeds}
          </Label>
          <span className="text-[10px] tabular-nums font-mono text-[#3f3f46]">
            {embeds.length}/{LIMITS.EMBEDS_PER_MESSAGE}
          </span>
        </div>

        <div className="space-y-1" {...getContainerProps()}>
          {embeds.map((embed, i) => (
            <EmbedCard
              key={embed.id}
              embed={embed}
              index={i}
              total={embeds.length}
              dragProps={getDragProps(i)}
              gripProps={getGripProps(i)}
            />
          ))}
        </div>

        {embeds.length < LIMITS.EMBEDS_PER_MESSAGE && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => addEmbed()}
            className="h-7 w-full border-dashed border-white/[0.08] text-[11px] text-[#71717a] hover:text-[#5865f2] hover:border-[#5865f2]/40 bg-transparent transition-colors"
          >
            <Plus className="size-3" />
            {t.classic.addEmbed}
          </Button>
        )}
      </div>
    </div>
  );
}
