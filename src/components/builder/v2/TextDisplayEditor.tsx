"use client";

import { useLocale } from "@/lib/i18n/locale-context";
import { MarkdownTextarea } from "../MarkdownTextarea";
import type { TextDisplayComponent } from "@/types/discord";

interface TextDisplayEditorProps {
  component: TextDisplayComponent;
  onChange: (updates: Partial<TextDisplayComponent>) => void;
}

export function TextDisplayEditor({
  component,
  onChange,
}: TextDisplayEditorProps) {
  const { t } = useLocale();
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-medium text-[#a1a1aa] uppercase tracking-[0.08em]">
        {t.v2.markdownContent}
      </label>
      <MarkdownTextarea
        value={component.content}
        onValueChange={(v) => onChange({ content: v })}
        placeholder={t.v2.markdownPlaceholder}
        className="min-h-16 bg-[#0a0a0b] border-white/[0.06] text-[#fafafa] text-sm placeholder:text-[#3f3f46]"
      />
    </div>
  );
}
