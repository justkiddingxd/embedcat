"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ButtonEditor } from "./ButtonEditor";
import { createButton } from "@/store/builder-store";
import type { ActionRowComponent, ButtonComponent } from "@/types/discord";
import { LIMITS } from "@/types/discord";
import { Plus, X } from "lucide-react";

interface ActionRowEditorProps {
  component: ActionRowComponent;
  onChange: (updates: Partial<ActionRowComponent>) => void;
}

export function ActionRowEditor({
  component,
  onChange,
}: ActionRowEditorProps) {
  const buttons = component.components;

  const updateButton = (idx: number, updates: Partial<ButtonComponent>) => {
    const next = buttons.map((b, i) =>
      i === idx ? { ...b, ...updates } : b
    );
    onChange({ components: next });
  };

  const addButton = () => {
    if (buttons.length >= LIMITS.ACTION_ROW_BUTTONS) return;
    onChange({ components: [...buttons, createButton()] });
  };

  const removeButton = (idx: number) => {
    onChange({ components: buttons.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#71717a]">
          Buttons
          <Badge
            variant="secondary"
            className="ml-2 bg-[#18181b] text-[#71717a] text-[10px] h-4 border-0"
          >
            {buttons.length}/{LIMITS.ACTION_ROW_BUTTONS}
          </Badge>
        </span>
        <Button
          variant="ghost"
          size="xs"
          onClick={addButton}
          disabled={buttons.length >= LIMITS.ACTION_ROW_BUTTONS}
          className="text-[#5865f2] hover:text-[#7983f5] hover:bg-[#5865f2]/10 text-xs gap-1"
        >
          <Plus className="size-3" />
          Add
        </Button>
      </div>

      <div className="space-y-1.5">
        {buttons.map((btn, idx) => (
          <div
            key={btn.id}
            className="relative rounded-md border border-white/[0.04] bg-white/[0.02] p-2"
          >
            <button
              onClick={() => removeButton(idx)}
              className="absolute top-1.5 right-1.5 p-0.5 rounded text-[#52525b] hover:text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <X className="size-3" />
            </button>
            <ButtonEditor
              button={btn}
              onChange={(updates) => updateButton(idx, updates)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
