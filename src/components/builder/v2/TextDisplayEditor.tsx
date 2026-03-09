"use client";

import { Textarea } from "@/components/ui/textarea";
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
      <label className="text-[10px] font-medium text-[#52525b] uppercase tracking-[0.08em]">
        Markdown Content
      </label>
      <Textarea
        value={component.content}
        onChange={(e) => onChange({ content: e.target.value })}
        placeholder="Write your markdown here..."
        className="min-h-16 bg-[#0a0a0b] border-white/[0.06] text-[#fafafa] text-sm placeholder:text-[#3f3f46]"
      />
    </div>
  );
}
