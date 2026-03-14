"use client";

import { useLocale } from "@/lib/i18n/locale-context";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from "@/components/ui/dropdown";
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
        <Dropdown
          value={String(component.spacing)}
          onValueChange={(val) =>
            onChange({ spacing: Number(val) as 1 | 2 })
          }
        >
          <DropdownTrigger size="sm" className="w-24">
            {component.spacing === 1 ? t.v2.small : t.v2.large}
          </DropdownTrigger>
          <DropdownContent>
            <DropdownItem value="1">{t.v2.small}</DropdownItem>
            <DropdownItem value="2">{t.v2.large}</DropdownItem>
          </DropdownContent>
        </Dropdown>
      </div>
    </div>
  );
}
