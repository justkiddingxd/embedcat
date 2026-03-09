"use client";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ButtonStyle, type ButtonComponent } from "@/types/discord";

interface ButtonEditorProps {
  button: ButtonComponent;
  onChange: (updates: Partial<ButtonComponent>) => void;
}

const STYLE_OPTIONS: { value: ButtonStyle; label: string; color: string }[] = [
  { value: ButtonStyle.Primary, label: "Primary", color: "#5865f2" },
  { value: ButtonStyle.Secondary, label: "Secondary", color: "#4e5058" },
  { value: ButtonStyle.Success, label: "Success", color: "#248046" },
  { value: ButtonStyle.Danger, label: "Danger", color: "#da373c" },
  { value: ButtonStyle.Link, label: "Link", color: "#4e5058" },
];

export function ButtonEditor({ button, onChange }: ButtonEditorProps) {
  const isLink = button.style === ButtonStyle.Link;

  return (
    <div className="grid grid-cols-[1fr_1fr] gap-2">
      <div className="space-y-1">
        <label className="text-[10px] font-medium text-[#52525b] uppercase tracking-[0.08em]">
          Style
        </label>
        <Select
          value={String(button.style)}
          onValueChange={(val) => {
            const style = Number(val) as ButtonStyle;
            const updates: Partial<ButtonComponent> = { style };
            if (style === ButtonStyle.Link) {
              updates.url = updates.url || "";
              updates.custom_id = undefined;
            } else {
              updates.custom_id = updates.custom_id || button.custom_id || "";
              updates.url = undefined;
            }
            onChange(updates);
          }}
        >
          <SelectTrigger className="h-7 border-white/[0.06] bg-[#0a0a0b] text-[#e4e4e7] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-white/[0.08] bg-[#111113]">
            {STYLE_OPTIONS.map((opt) => (
              <SelectItem
                key={opt.value}
                value={String(opt.value)}
                className="text-[#e4e4e7] text-xs"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: opt.color }}
                  />
                  {opt.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-medium text-[#52525b] uppercase tracking-[0.08em]">
          Label
        </label>
        <Input
          value={button.label || ""}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Click me"
          className="h-7 border-white/[0.06] bg-[#0a0a0b] text-[#e4e4e7] text-xs placeholder:text-[#3f3f46]"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-medium text-[#52525b] uppercase tracking-[0.08em]">
          {isLink ? "URL" : "Custom ID"}
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
          placeholder={isLink ? "https://..." : "my-button-id"}
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
            Disabled
          </Label>
        </div>
      </div>
    </div>
  );
}
