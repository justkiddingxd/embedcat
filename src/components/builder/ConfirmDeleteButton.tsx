"use client";

import { useState, useRef, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmDeleteButtonProps {
  onConfirm: () => void;
  className?: string;
}

export function ConfirmDeleteButton({ onConfirm, className }: ConfirmDeleteButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirming) {
      setConfirming(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      onConfirm();
    } else {
      setConfirming(true);
      timerRef.current = setTimeout(() => setConfirming(false), 3000);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="relative">
      {confirming && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap rounded-md bg-red-500/15 border border-red-500/25 px-2 py-0.5 text-[10px] font-medium text-red-400"
          style={{ animation: "confirmFadeIn 150ms ease-out" }}
        >
          You sure?
        </div>
      )}
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={handleClick}
        className={confirming
          ? "text-red-400 bg-red-500/10"
          : className || "text-[#52525b] hover:text-red-400 transition-colors"
        }
      >
        <Trash2 className="size-3" />
      </Button>
    </div>
  );
}
