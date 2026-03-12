"use client";

import { useLocale } from "@/lib/i18n/locale-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MarkdownTextarea } from "../MarkdownTextarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ButtonEditor } from "./ButtonEditor";
import { createTextDisplay, createButton, createThumbnail } from "@/store/builder-store";
import {
  ComponentType,
  LIMITS,
  type SectionComponent,
  type ButtonComponent,
  type ThumbnailComponent,
} from "@/types/discord";
import { Plus, X, ImageIcon } from "lucide-react";

interface SectionEditorProps {
  component: SectionComponent;
  onChange: (updates: Partial<SectionComponent>) => void;
}

export function SectionEditor({ component, onChange }: SectionEditorProps) {
  const { t } = useLocale();
  const texts = component.components;
  const accessory = component.accessory;

  const updateText = (idx: number, content: string) => {
    const next = texts.map((t, i) =>
      i === idx ? { ...t, content } : t
    );
    onChange({ components: next });
  };

  const addText = () => {
    if (texts.length >= LIMITS.SECTION_TEXT_COMPONENTS) return;
    onChange({ components: [...texts, createTextDisplay("")] });
  };

  const removeText = (idx: number) => {
    if (texts.length <= 1) return;
    onChange({ components: texts.filter((_, i) => i !== idx) });
  };

  const accessoryType: string = accessory
    ? accessory.type === ComponentType.Button
      ? "button"
      : "thumbnail"
    : "none";

  const setAccessoryType = (val: string | null) => {
    if (!val) return;
    if (val === "none") {
      onChange({ accessory: undefined });
    } else if (val === "button") {
      onChange({ accessory: createButton() });
    } else {
      onChange({ accessory: createThumbnail() });
    }
  };

  const updateAccessory = (
    updates: Partial<ButtonComponent> | Partial<ThumbnailComponent>
  ) => {
    if (!accessory) return;
    onChange({ accessory: { ...accessory, ...updates } as typeof accessory });
  };

  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#71717a]">
            {t.v2.textContent}
            <Badge
              variant="secondary"
              className="ml-2 bg-[#18181b] text-[#71717a] text-[10px] h-4 border-0"
            >
              {texts.length}/{LIMITS.SECTION_TEXT_COMPONENTS}
            </Badge>
          </span>
          <Button
            variant="ghost"
            size="xs"
            onClick={addText}
            disabled={texts.length >= LIMITS.SECTION_TEXT_COMPONENTS}
            className="text-[#5865f2] hover:text-[#7983f5] hover:bg-[#5865f2]/10 text-xs gap-1"
          >
            <Plus className="size-3" />
            {t.v2.add}
          </Button>
        </div>

        {texts.map((td, idx) => (
          <div key={td.id} className="relative">
            <MarkdownTextarea
              value={td.content}
              onValueChange={(v) => updateText(idx, v)}
              placeholder={t.v2.sectionPlaceholder}
              className="min-h-12 pr-7 bg-[#0a0a0b] border-white/[0.06] text-[#e4e4e7] text-xs placeholder:text-[#3f3f46]"
            />
            {texts.length > 1 && (
              <button
                onClick={() => removeText(idx)}
                className="absolute top-1.5 right-1.5 p-0.5 rounded text-[#52525b] hover:text-red-400 hover:bg-red-400/10 transition-colors"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-white/[0.04] pt-2 space-y-1.5">
        <div className="flex items-center gap-3">
          <label className="text-xs text-[#71717a] shrink-0">{t.v2.accessory}</label>
          <Select value={accessoryType} onValueChange={(val) => setAccessoryType(val)}>
            <SelectTrigger className="h-7 w-32 border-white/[0.06] bg-[#0a0a0b] text-[#e4e4e7] text-xs">
              <SelectValue>{accessoryType === "none" ? t.v2.none : accessoryType === "button" ? t.v2.button : t.v2.thumbnail}</SelectValue>
            </SelectTrigger>
            <SelectContent className="border-white/[0.08] bg-[#111113]">
              <SelectItem value="none" className="text-[#e4e4e7] text-xs">
                {t.v2.none}
              </SelectItem>
              <SelectItem value="button" className="text-[#e4e4e7] text-xs">
                {t.v2.button}
              </SelectItem>
              <SelectItem value="thumbnail" className="text-[#e4e4e7] text-xs">
                {t.v2.thumbnail}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {accessory && accessory.type === ComponentType.Button && (
          <div className="rounded-md border border-white/[0.04] bg-white/[0.02] p-2">
            <ButtonEditor
              button={accessory}
              onChange={(updates) => updateAccessory(updates)}
            />
          </div>
        )}

        {accessory && accessory.type === ComponentType.Thumbnail && (
          <div className="rounded-md border border-white/[0.04] bg-white/[0.02] p-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="size-3.5 text-[#52525b] shrink-0" />
              <Input
                value={accessory.media.url}
                onChange={(e) =>
                  updateAccessory({
                    media: { url: e.target.value },
                  } as Partial<ThumbnailComponent>)
                }
                placeholder="https://example.com/thumb.png"
                className="h-7 border-white/[0.06] bg-[#0a0a0b] text-[#e4e4e7] text-xs placeholder:text-[#3f3f46]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
