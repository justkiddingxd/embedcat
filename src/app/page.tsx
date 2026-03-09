"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useBuilderStore } from "@/store/builder-store";
import { Header } from "@/components/layout/Header";
import { ClassicBuilder } from "@/components/builder/ClassicBuilder";
import { ComponentsV2Editor } from "@/components/builder/ComponentsV2Editor";
import MessagePreview from "@/components/preview/MessagePreview";
import { WebhookPanel } from "@/components/builder/WebhookPanel";
import { JsonEditor } from "@/components/builder/JsonEditor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { RotateCcw, Layers, Box, AlertTriangle } from "lucide-react";

const STORAGE_KEY = "embedcat-preview-width";
const MIN_WIDTH = 280;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 380;

function loadWidth(): number {
  if (typeof window === "undefined") return DEFAULT_WIDTH;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return DEFAULT_WIDTH;
  const n = parseInt(stored, 10);
  if (Number.isNaN(n) || n < MIN_WIDTH || n > MAX_WIDTH) return DEFAULT_WIDTH;
  return n;
}

export default function Home() {
  const { mode, setMode, reset } = useBuilderStore();
  const [previewWidth, setPreviewWidth] = useState(DEFAULT_WIDTH);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_WIDTH);

  useEffect(() => {
    setPreviewWidth(loadWidth());
  }, []);

  const persistWidth = useCallback((w: number) => {
    localStorage.setItem(STORAGE_KEY, String(w));
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      isDragging.current = true;
      startX.current = e.clientX;
      startWidth.current = previewWidth;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [previewWidth]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      const delta = startX.current - e.clientX;
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
      setPreviewWidth(next);
    },
    []
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      isDragging.current = false;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      const delta = startX.current - e.clientX;
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
      persistWidth(next);
    },
    [persistWidth]
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#09090b]">
      <Header />
      <div className="mx-auto flex w-full max-w-[1400px] flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex h-9 items-center justify-between border-b border-white/[0.06] px-3">
            <div className="flex items-center gap-0.5 rounded-full bg-[#111113] p-0.5 ring-1 ring-white/[0.06]">
              <button
                onClick={() => setMode("classic")}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all duration-200 ${
                  mode === "classic"
                    ? "bg-[#5865f2] text-white shadow-sm shadow-[#5865f2]/20"
                    : "text-[#71717a] hover:text-[#a1a1aa]"
                }`}
              >
                <Layers className="size-3" />
                Classic
              </button>
              <button
                onClick={() => setMode("components_v2")}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all duration-200 ${
                  mode === "components_v2"
                    ? "bg-[#5865f2] text-white shadow-sm shadow-[#5865f2]/20"
                    : "text-[#71717a] hover:text-[#a1a1aa]"
                }`}
              >
                <Box className="size-3" />
                Components
              </button>
            </div>
            <div className="flex items-center gap-1">
              <JsonEditor />
              <Dialog>
                <DialogTrigger
                  className="inline-flex items-center justify-center rounded-md h-7 w-7 text-[#71717a] hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <RotateCcw className="size-3.5" />
                </DialogTrigger>
                <DialogContent
                  showCloseButton={false}
                  className="bg-[#111113] border border-white/[0.08] ring-0 shadow-2xl shadow-black/60 max-w-xs"
                >
                  <DialogHeader className="items-center text-center">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500/10 mb-1">
                      <AlertTriangle className="size-5 text-red-400" />
                    </div>
                    <DialogTitle className="text-[#e4e4e7]">Are you sure?</DialogTitle>
                    <DialogDescription className="text-[#71717a]">
                      Your embed will be deleted and all progress will be lost.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="bg-transparent border-white/[0.06] flex-row gap-2 sm:justify-center">
                    <DialogClose
                      className="inline-flex items-center justify-center rounded-md h-8 px-4 text-xs font-medium bg-white/[0.06] text-[#a1a1aa] hover:bg-white/[0.1] hover:text-white transition-colors"
                    >
                      Cancel
                    </DialogClose>
                    <DialogClose
                      className="inline-flex items-center justify-center rounded-md h-8 px-4 text-xs font-medium bg-red-500/80 text-white hover:bg-red-500 transition-colors"
                      onClick={reset}
                    >
                      Delete
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-1.5">
              <WebhookPanel />
              {mode === "classic" ? <ClassicBuilder /> : <ComponentsV2Editor />}
            </div>
          </div>
        </div>

        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="relative z-10 w-1 shrink-0 cursor-col-resize select-none group"
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
          <div className="h-full w-px mx-auto bg-white/[0.06] group-hover:bg-[#5865f2]/50 group-active:bg-[#5865f2] transition-colors" />
        </div>

        <div
          className="flex shrink-0 flex-col bg-[#09090b]"
          style={{ width: previewWidth }}
        >
          <div className="flex h-9 items-center border-b border-white/[0.06] px-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#52525b]">
              Preview
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-3">
              <MessagePreview />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
