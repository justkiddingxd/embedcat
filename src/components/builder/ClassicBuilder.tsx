"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";
import { useBuilderStore } from "@/store/builder-store";
import { LIMITS } from "@/types/discord";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmbedEditor } from "./EmbedEditor";

function EmbedCard({
  embed,
  index,
  total,
}: {
  embed: { id: string; title?: string; color?: number };
  index: number;
  total: number;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const { removeEmbed, duplicateEmbed, moveEmbed } = useBuilderStore();
  const store = useBuilderStore();
  const fullEmbed = store.embeds.find((e) => e.id === embed.id)!;

  const colorHex = `#${(embed.color ?? 0x5865f2).toString(16).padStart(6, "0")}`;
  const titlePreview = embed.title?.slice(0, 40) || "Untitled embed";

  return (
    <div className="rounded-lg bg-[#111113] border border-white/[0.06] overflow-hidden">
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div
          className="w-1 h-6 rounded-full shrink-0"
          style={{ backgroundColor: colorHex }}
        />
        <GripVertical className="size-3.5 text-[#3f3f46] shrink-0" />
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Badge
            variant="secondary"
            className="shrink-0 bg-[#18181b] text-[#71717a] border-0 text-[10px] px-1.5"
          >
            {index + 1}
          </Badge>
          <span className="text-sm text-[#e4e4e7] truncate">{titlePreview}</span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
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
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation();
              removeEmbed(embed.id);
            }}
            className="text-[#52525b] hover:text-red-400 transition-colors"
          >
            <Trash2 className="size-3" />
          </Button>
          <ChevronDown
            className={`size-3.5 text-[#52525b] ml-1 transition-transform duration-200 ${
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
  const { content, setContent, embeds, addEmbed } = useBuilderStore();

  return (
    <div className="space-y-2">
      <div className="rounded-lg bg-[#111113] border border-white/[0.06] p-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#52525b]">
            Message Content
          </Label>
          <span
            className={`text-[11px] tabular-nums font-mono ${
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
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Message content — appears above embeds"
          maxLength={LIMITS.CONTENT}
          className="bg-[#0a0a0b] border-white/[0.06] text-[#fafafa] placeholder:text-[#3f3f46] text-sm min-h-[60px]"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <Label className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#52525b]">
            Embeds
          </Label>
          <span className="text-[11px] tabular-nums font-mono text-[#3f3f46]">
            {embeds.length}/{LIMITS.EMBEDS_PER_MESSAGE}
          </span>
        </div>

        <div className="space-y-2">
          {embeds.map((embed, i) => (
            <EmbedCard
              key={embed.id}
              embed={embed}
              index={i}
              total={embeds.length}
            />
          ))}
        </div>

        {embeds.length < LIMITS.EMBEDS_PER_MESSAGE && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => addEmbed()}
            className="w-full border-dashed border-white/[0.08] text-[#71717a] hover:text-[#5865f2] hover:border-[#5865f2]/40 bg-transparent transition-colors"
          >
            <Plus className="size-3.5" />
            Add Embed
          </Button>
        )}
      </div>
    </div>
  );
}
