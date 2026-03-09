"use client";

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
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-medium text-[#a1a1aa] uppercase tracking-[0.08em]">
        Markdown Content
      </label>
      <MarkdownTextarea
        value={component.content}
        onValueChange={(v) => onChange({ content: v })}
        placeholder="Write your markdown here..."
        className="min-h-16 bg-[#0a0a0b] border-white/[0.06] text-[#fafafa] text-sm placeholder:text-[#3f3f46]"
      />
    </div>
  );
}
