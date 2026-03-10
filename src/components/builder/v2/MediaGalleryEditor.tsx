"use client";

import { useLocale } from "@/lib/i18n/locale-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { createMediaGalleryItem } from "@/store/builder-store";
import type {
  MediaGalleryComponent,
  MediaGalleryItem,
} from "@/types/discord";
import { LIMITS } from "@/types/discord";
import { Plus, X, ImageIcon } from "lucide-react";

interface MediaGalleryEditorProps {
  component: MediaGalleryComponent;
  onChange: (updates: Partial<MediaGalleryComponent>) => void;
}

export function MediaGalleryEditor({
  component,
  onChange,
}: MediaGalleryEditorProps) {
  const { t } = useLocale();
  const items = component.items;

  const updateItem = (idx: number, updates: Partial<MediaGalleryItem>) => {
    const next = items.map((item, i) => {
      if (i !== idx) return item;
      return {
        ...item,
        ...updates,
        media: updates.media
          ? { ...item.media, ...updates.media }
          : item.media,
      };
    });
    onChange({ items: next });
  };

  const addItem = () => {
    if (items.length >= LIMITS.MEDIA_GALLERY_ITEMS) return;
    onChange({ items: [...items, createMediaGalleryItem()] });
  };

  const removeItem = (idx: number) => {
    if (items.length <= 1) return;
    onChange({ items: items.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#71717a]">
          {t.v2.mediaItems}
          <Badge
            variant="secondary"
            className="ml-2 bg-[#18181b] text-[#71717a] text-[10px] h-4 border-0"
          >
            {items.length}/{LIMITS.MEDIA_GALLERY_ITEMS}
          </Badge>
        </span>
        <Button
          variant="ghost"
          size="xs"
          onClick={addItem}
          disabled={items.length >= LIMITS.MEDIA_GALLERY_ITEMS}
          className="text-[#5865f2] hover:text-[#7983f5] hover:bg-[#5865f2]/10 text-xs gap-1"
        >
          <Plus className="size-3" />
          {t.v2.add}
        </Button>
      </div>

      <div className="space-y-1.5">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="relative rounded-md border border-white/[0.04] bg-white/[0.02] p-2 space-y-1.5"
          >
            <button
              onClick={() => removeItem(idx)}
              disabled={items.length <= 1}
              className="absolute top-1.5 right-1.5 p-0.5 rounded text-[#52525b] hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <X className="size-3" />
            </button>

            <div className="flex items-center gap-2">
              <ImageIcon className="size-3.5 text-[#52525b] shrink-0" />
              <Input
                value={item.media.url}
                onChange={(e) =>
                  updateItem(idx, { media: { url: e.target.value } })
                }
                placeholder="https://example.com/image.png"
                className="h-7 border-white/[0.06] bg-[#0a0a0b] text-[#e4e4e7] text-xs placeholder:text-[#3f3f46]"
              />
            </div>

            <div className="flex items-center gap-2">
              <Input
                value={item.description || ""}
                onChange={(e) =>
                  updateItem(idx, { description: e.target.value })
                }
                placeholder={t.v2.descriptionAlt}
                className="h-7 flex-1 border-white/[0.06] bg-[#0a0a0b] text-[#e4e4e7] text-xs placeholder:text-[#3f3f46]"
              />
              <div className="flex items-center gap-1.5 shrink-0">
                <Switch
                  checked={item.spoiler || false}
                  onCheckedChange={(val) =>
                    updateItem(idx, { spoiler: val })
                  }
                  className="data-checked:bg-[#5865f2]"
                  size="sm"
                />
                <Label className="text-[10px] text-[#52525b] cursor-pointer">
                  {t.v2.spoiler}
                </Label>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
