"use client";

import { useLocale } from "@/lib/i18n/locale-context";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from "@/components/ui/dropdown";
import { ExternalLink } from "lucide-react";
import { ButtonStyle, type ButtonComponent } from "@/types/discord";
import { ActionChainEditor } from "./ActionChainEditor";

interface ButtonEditorProps {
  button: ButtonComponent;
  onChange: (updates: Partial<ButtonComponent>) => void;
}

const STYLE_COLORS: Record<ButtonStyle, string> = {
  [ButtonStyle.Primary]: "#5865f2",
  [ButtonStyle.Secondary]: "#4e5058",
  [ButtonStyle.Success]: "#248046",
  [ButtonStyle.Danger]: "#da373c",
  [ButtonStyle.Link]: "#4e5058",
};

export function ButtonEditor({ button, onChange }: ButtonEditorProps) {
  const { t } = useLocale();
  const isLink = button.style === ButtonStyle.Link;

  const STYLE_OPTIONS: { value: ButtonStyle; label: string; color: string }[] = [
    { value: ButtonStyle.Primary, label: t.button.primary, color: STYLE_COLORS[ButtonStyle.Primary] },
    { value: ButtonStyle.Secondary, label: t.button.secondary, color: STYLE_COLORS[ButtonStyle.Secondary] },
    { value: ButtonStyle.Success, label: t.button.success, color: STYLE_COLORS[ButtonStyle.Success] },
    { value: ButtonStyle.Danger, label: t.button.danger, color: STYLE_COLORS[ButtonStyle.Danger] },
    { value: ButtonStyle.Link, label: t.button.link, color: STYLE_COLORS[ButtonStyle.Link] },
  ];

  return (
    <div className="space-y-0">
    <div className="grid grid-cols-[1fr_1fr] gap-2">
      <div className="space-y-1">
        <label className="text-[10px] font-medium text-[#a1a1aa] uppercase tracking-[0.08em]">
          {t.button.style}
        </label>
        <Dropdown
          value={String(button.style)}
          onValueChange={(val) => {
            const style = Number(val) as ButtonStyle;
            const updates: Partial<ButtonComponent> = { style };
            if (style === ButtonStyle.Link) {
              updates.url = button.url || "";
              delete updates.custom_id;
            } else {
              updates.custom_id = button.custom_id || `btn_${Math.random().toString(36).slice(2, 10)}`;
              delete updates.url;
            }
            onChange(updates);
          }}
        >
          <DropdownTrigger size="sm">
            <StyleIcon style={button.style} />
            {STYLE_OPTIONS.find((o) => o.value === button.style)?.label ?? "Secondary"}
          </DropdownTrigger>
          <DropdownContent>
            {STYLE_OPTIONS.map((opt) => (
              <DropdownItem key={opt.value} value={String(opt.value)}>
                <span className="flex items-center gap-2">
                  <StyleIcon style={opt.value} />
                  {opt.label}
                </span>
              </DropdownItem>
            ))}
          </DropdownContent>
        </Dropdown>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-medium text-[#a1a1aa] uppercase tracking-[0.08em]">
          {t.button.label}
        </label>
        <Input
          value={button.label || ""}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder={t.button.labelPlaceholder}
          className="h-7 border-white/[0.06] bg-[#0a0a0b] text-[#e4e4e7] text-xs placeholder:text-[#3f3f46]"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-medium text-[#a1a1aa] uppercase tracking-[0.08em]">
          {isLink ? t.button.url : t.button.customId}
        </label>
        <Input
          value={isLink ? button.url || "" : button.custom_id || ""}
          onChange={(e) =>
            onChange(
              isLink
                ? { url: e.target.value }
                : { custom_id: e.target.value }
            )
          }
          placeholder={isLink ? "https://..." : t.button.customIdPlaceholder}
          className="h-7 border-white/[0.06] bg-[#0a0a0b] text-[#e4e4e7] text-xs placeholder:text-[#3f3f46]"
        />
      </div>

      <div className="flex items-end pb-0.5">
        <div className="flex items-center gap-2">
          <Switch
            checked={button.disabled || false}
            onCheckedChange={(val) => onChange({ disabled: val })}
            className="data-checked:bg-[#5865f2]"
            size="sm"
          />
          <Label className="text-[10px] text-[#71717a] cursor-pointer">
            {t.button.disabled}
          </Label>
        </div>
      </div>
    </div>

    {!isLink && button.custom_id && (
      <ActionChainEditor buttonId={button.custom_id} />
    )}
    </div>
  );
}

function StyleIcon({ style }: { style: ButtonStyle }) {
  if (style === ButtonStyle.Link) {
    return <ExternalLink className="size-3 text-[#a1a1aa] shrink-0" />;
  }
  return (
    <span
      className="size-2.5 rounded-full shrink-0"
      style={{ background: STYLE_COLORS[style] ?? "#4e5058" }}
    />
  );
}
