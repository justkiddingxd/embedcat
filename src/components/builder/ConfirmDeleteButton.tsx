"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmDeleteButtonProps {
  onConfirm: () => void;
  className?: string;
}

export function ConfirmDeleteButton({ onConfirm, className }: ConfirmDeleteButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirming) {
      setConfirming(false);
      setPos(null);
      if (timerRef.current) clearTimeout(timerRef.current);
      onConfirm();
    } else {
      setConfirming(true);
      if (btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        setPos({ x: rect.left + rect.width / 2, y: rect.top });
      }
      timerRef.current = setTimeout(() => { setConfirming(false); setPos(null); }, 3000);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <>
      <Button
        ref={btnRef}
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
      {confirming && pos && createPortal(
        <div
          className="fixed z-[9999] whitespace-nowrap rounded-md bg-red-500/15 border border-red-500/25 px-2 py-0.5 text-[10px] font-medium text-red-400 pointer-events-none"
          style={{
            left: pos.x,
            top: pos.y,
            transform: "translate(-50%, calc(-100% - 4px))",
            animation: "confirmFadeIn 150ms ease-out",
          }}
        >
          You sure?
        </div>,
        document.body
      )}
    </>
  );
}
