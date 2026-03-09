"use client";

import {
  ChevronUp,
  ChevronDown,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function ComponentHeader({
  label,
  icon: Icon,
  accent,
  onMoveUp,
  onMoveDown,
  onDelete,
  children,
}: {
  label: string;
  icon: LucideIcon;
  accent?: string;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 rounded-t-lg bg-[#1e1f22] px-3 py-2">
      <Icon className="size-3.5 text-gray-400" />
      <span
        className="text-xs font-semibold tracking-wide uppercase"
        style={{ color: accent || "#b5bac1" }}
      >
        {label}
      </span>
      {children}
      <div className="ml-auto flex items-center gap-0.5">
        {onMoveUp && (
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-gray-400 hover:text-gray-100"
            onClick={onMoveUp}
          >
            <ChevronUp className="size-3.5" />
          </Button>
        )}
        {onMoveDown && (
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-gray-400 hover:text-gray-100"
            onClick={onMoveDown}
          >
            <ChevronDown className="size-3.5" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-gray-400 hover:text-red-400"
            onClick={onDelete}
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function ComponentCard({
  children,
  borderColor,
}: {
  children: React.ReactNode;
  borderColor?: string;
}) {
  return (
    <div
      className="overflow-hidden rounded-lg border border-[#3f4147]/60 bg-[#2b2d31]"
      style={
        borderColor
          ? { borderLeftWidth: 3, borderLeftColor: borderColor }
          : undefined
      }
    >
      {children}
    </div>
  );
}

export function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-medium text-gray-300">{label}</span>
        {hint && (
          <span className="text-[10px] text-gray-500">{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}
