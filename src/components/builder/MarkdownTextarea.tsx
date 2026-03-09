"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Underline,
  EyeOff,
  Quote,
  Link,
} from "lucide-react";

interface FormatAction {
  icon: React.ElementType;
  label: string;
  prefix: string;
  suffix: string;
}

const FORMATS: FormatAction[] = [
  { icon: Bold, label: "Bold", prefix: "**", suffix: "**" },
  { icon: Italic, label: "Italic", prefix: "*", suffix: "*" },
  { icon: Underline, label: "Underline", prefix: "__", suffix: "__" },
  { icon: Strikethrough, label: "Strikethrough", prefix: "~~", suffix: "~~" },
  { icon: Code, label: "Code", prefix: "`", suffix: "`" },
  { icon: EyeOff, label: "Spoiler", prefix: "||", suffix: "||" },
  { icon: Quote, label: "Quote", prefix: "> ", suffix: "" },
  { icon: Link, label: "Link", prefix: "[", suffix: "](url)" },
];

interface MarkdownTextareaProps
  extends React.ComponentProps<"textarea"> {
  value: string;
  onValueChange: (value: string) => void;
}

export function MarkdownTextarea({
  value,
  onValueChange,
  className,
  ...props
}: MarkdownTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [toolbar, setToolbar] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const selectionRef = useRef<{ start: number; end: number } | null>(null);

  const checkSelection = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (start === end) {
      setToolbar(null);
      return;
    }
    selectionRef.current = { start, end };

    const text = el.value.substring(0, start);
    const lines = text.split("\n");
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 18;
    const paddingTop = parseFloat(getComputedStyle(el).paddingTop) || 0;
    const paddingLeft = parseFloat(getComputedStyle(el).paddingLeft) || 0;

    const rect = el.getBoundingClientRect();
    const lineIndex = lines.length - 1;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const font = getComputedStyle(el).font;
    let charX = paddingLeft;
    if (ctx) {
      ctx.font = font;
      const lastLine = lines[lineIndex] || "";
      charX = paddingLeft + ctx.measureText(lastLine).width;
    }

    const endText = el.value.substring(0, end);
    const endLines = endText.split("\n");
    const endLineIndex = endLines.length - 1;
    let endCharX = paddingLeft;
    if (ctx) {
      ctx.font = getComputedStyle(el).font;
      const lastEndLine = endLines[endLineIndex] || "";
      endCharX = paddingLeft + ctx.measureText(lastEndLine).width;
    }

    const midX = lineIndex === endLineIndex
      ? (charX + endCharX) / 2
      : (charX + el.clientWidth - paddingLeft) / 2;

    const y = rect.top + paddingTop + lineIndex * lineHeight - el.scrollTop - 6;
    const x = rect.left + Math.min(Math.max(midX, 60), el.clientWidth - 60);

    setToolbar({ x, y });
  }, []);

  const applyFormat = useCallback(
    (format: FormatAction) => {
      const el = textareaRef.current;
      const sel = selectionRef.current;
      if (!el || !sel) return;

      const before = value.substring(0, sel.start);
      const selected = value.substring(sel.start, sel.end);
      const after = value.substring(sel.end);
      const newValue = before + format.prefix + selected + format.suffix + after;
      onValueChange(newValue);

      setToolbar(null);

      requestAnimationFrame(() => {
        const newStart = sel.start + format.prefix.length;
        const newEnd = newStart + selected.length;
        el.focus();
        el.setSelectionRange(newStart, newEnd);
      });
    },
    [value, onValueChange]
  );

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (
        toolbarRef.current?.contains(e.target as Node) ||
        textareaRef.current?.contains(e.target as Node)
      )
        return;
      setToolbar(null);
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onMouseUp={checkSelection}
        onKeyUp={checkSelection}
        className={className}
        {...props}
      />
      {toolbar && (
        <div
          ref={toolbarRef}
          className="fixed z-[100] flex items-center gap-0.5 rounded-lg border border-white/[0.1] bg-[#18181b]/95 backdrop-blur-sm px-1 py-0.5 shadow-xl shadow-black/40"
          style={{
            left: toolbar.x,
            top: toolbar.y,
            transform: "translate(-50%, -100%)",
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {FORMATS.map((format) => (
            <button
              key={format.label}
              onClick={() => applyFormat(format)}
              title={format.label}
              className="flex items-center justify-center rounded-md h-6 w-6 text-[#a1a1aa] hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <format.icon className="size-3.5" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
