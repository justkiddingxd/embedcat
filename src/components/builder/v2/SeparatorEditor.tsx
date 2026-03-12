"use client";

import { useLocale } from "@/lib/i18n/locale-context";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SeparatorComponent } from "@/types/discord";

interface SeparatorEditorProps {
  component: SeparatorComponent;
  onChange: (updates: Partial<SeparatorComponent>) => void;
}

export function SeparatorEditor({
  component,
  onChange,
}: SeparatorEditorProps) {
  const { t } = useLocale();
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Switch
          checked={component.divider}
          onCheckedChange={(val) => onChange({ divider: val })}
          className="data-checked:bg-[#5865f2]"
          size="sm"
        />
        <Label className="text-xs text-[#71717a] cursor-pointer">
          {t.v2.showDivider}
        </Label>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-[#71717a]">{t.v2.spacing}</label>
        <Select
          value={String(component.spacing)}
          onValueChange={(val) =>
            onChange({ spacing: Number(val) as 1 | 2 })
          }
        >
          <SelectTrigger className="h-7 w-24 border-white/[0.06] bg-[#0a0a0b] text-[#e4e4e7] text-xs">
            <SelectValue>{component.spacing === 1 ? t.v2.small : t.v2.large}</SelectValue>
          </SelectTrigger>
          <SelectContent className="border-white/[0.08] bg-[#111113]">
            <SelectItem value="1" className="text-[#e4e4e7] text-xs">
              {t.v2.small}
            </SelectItem>
            <SelectItem value="2" className="text-[#e4e4e7] text-xs">
              {t.v2.large}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
