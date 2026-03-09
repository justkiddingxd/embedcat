"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useBuilderStore } from "@/store/builder-store";
import { Header } from "@/components/layout/Header";
import { ClassicBuilder } from "@/components/builder/ClassicBuilder";
import { ComponentsV2Editor } from "@/components/builder/ComponentsV2Editor";
import MessagePreview from "@/components/preview/MessagePreview";
import { WebhookPanel } from "@/components/builder/WebhookPanel";
import { JsonEditor } from "@/components/builder/JsonEditor";
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
import { RotateCcw, Layers, Box, AlertTriangle, Share2, Check, Trash2, ExternalLink, Bookmark, Pencil, ChevronDown } from "lucide-react";
import { buildClassicPayload, buildComponentsV2Payload } from "@/lib/build-payload";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";

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

interface SavedEmbedItem {
  id: string;
  title: string;
  mode: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

function HomeContent() {
  const { mode, setMode, reset, content, embeds, components, webhook, loadFromPayload } = useBuilderStore();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [previewWidth, setPreviewWidth] = useState(DEFAULT_WIDTH);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_WIDTH);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [savedEmbeds, setSavedEmbeds] = useState<SavedEmbedItem[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const loadedRef = useRef(false);

  useEffect(() => {
    setPreviewWidth(loadWidth());
  }, []);

  useEffect(() => {
    if (loadedRef.current) return;
    const id = searchParams.get("id");
    if (!id) return;
    loadedRef.current = true;
    fetch(`/api/embeds/${id}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data: SavedEmbedItem) => {
        if (data.mode && data.payload) {
          loadFromPayload(data.mode as "classic" | "components_v2", data.payload);
        }
      })
      .catch(() => { void 0; });
  }, [searchParams, loadFromPayload]);

  const buildCurrentPayload = useCallback(() => {
    return mode === "classic"
      ? buildClassicPayload(content, embeds, webhook)
      : buildComponentsV2Payload(components, webhook);
  }, [mode, content, embeds, components, webhook]);

  const handleCopyLink = async () => {
    setShareLoading(true);
    try {
      const payload = buildCurrentPayload();
      const res = await fetch("/api/embeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, payload, title: embeds[0]?.title || "Untitled" }),
      });
      const data = (await res.json()) as { id: string };
      const url = `${window.location.origin}?id=${data.id}`;
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      router.replace(`?id=${data.id}`);
      setTimeout(() => setShareCopied(false), 2000);
    } catch { void 0; }
    setShareLoading(false);
  };

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const handleSaveToProfile = async () => {
    if (!session?.user) return;
    setSaveStatus("saving");
    try {
      const payload = buildCurrentPayload();
      await fetch("/api/embeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, payload, title: embeds[0]?.title || "Untitled" }),
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch { void 0; setSaveStatus("idle"); }
  };

  const loadSaved = async () => {
    setSavedLoading(true);
    try {
      const res = await fetch("/api/embeds");
      if (res.ok) {
        setSavedEmbeds((await res.json()) as SavedEmbedItem[]);
      }
    } catch { void 0; }
    setSavedLoading(false);
  };

  const handleOpenSaved = () => {
    setSavedOpen(true);
    loadSaved();
  };

  const handleDeleteSaved = async (id: string) => {
    await fetch(`/api/embeds/${id}`, { method: "DELETE" });
    setSavedEmbeds((prev) => prev.filter((e) => e.id !== id));
  };

  const handleRenameSaved = async (id: string, title: string) => {
    await fetch(`/api/embeds/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setSavedEmbeds((prev) => prev.map((e) => e.id === id ? { ...e, title } : e));
    setEditingId(null);
  };

  const handleLoadSaved = (item: SavedEmbedItem) => {
    loadFromPayload(item.mode as "classic" | "components_v2", item.payload);
    router.replace(`?id=${item.id}`);
    setSavedOpen(false);
  };

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
      <Header onOpenSaved={handleOpenSaved} />
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
              <button
                onClick={handleCopyLink}
                disabled={shareLoading}
                className="inline-flex h-7 items-center gap-1.5 rounded-full border border-white/[0.06] px-2.5 text-[0.8rem] font-medium text-[#71717a] hover:bg-white/[0.04] hover:text-[#a1a1aa] transition-colors disabled:opacity-50"
              >
                {shareCopied ? <Check className="size-3.5 text-emerald-400" /> : <Share2 className="size-3.5" />}
                {shareCopied ? "Copied!" : "Link"}
              </button>
              {session?.user && (
                <button
                  onClick={handleSaveToProfile}
                  disabled={saveStatus === "saving"}
                  className="inline-flex h-7 items-center gap-1.5 rounded-full border border-white/[0.06] px-2.5 text-[0.8rem] font-medium text-[#71717a] hover:bg-white/[0.04] hover:text-[#a1a1aa] transition-colors disabled:opacity-50"
                >
                  {saveStatus === "saved" ? <Check className="size-3.5 text-emerald-400" /> : <Bookmark className="size-3.5" />}
                  {saveStatus === "saved" ? "Saved!" : "Save"}
                </button>
              )}
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
      {savedOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setSavedOpen(false)}>
          <div
            className="w-full max-w-2xl max-h-[80vh] rounded-lg border border-white/[0.08] bg-[#111113] shadow-2xl shadow-black/60 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <h2 className="text-sm font-semibold text-[#e4e4e7]">Saved Embeds</h2>
              <button onClick={() => setSavedOpen(false)} className="text-[#71717a] hover:text-white transition-colors text-lg leading-none">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {savedLoading ? (
                <p className="text-sm text-[#71717a] text-center py-8">Loading...</p>
              ) : savedEmbeds.length === 0 ? (
                <p className="text-sm text-[#71717a] text-center py-8">No saved embeds yet</p>
              ) : (
                savedEmbeds.map((item) => (
                  <div key={item.id} className="rounded-md bg-white/[0.03] border border-white/[0.06] overflow-hidden">
                    <div className="flex items-center gap-2 p-2.5">
                      <button
                        onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                        className="text-[#52525b] hover:text-[#a1a1aa] transition-colors shrink-0"
                      >
                        <ChevronDown className={`size-3.5 transition-transform ${expandedId === item.id ? "rotate-180" : ""}`} />
                      </button>
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                        {editingId === item.id ? (
                          <input
                            autoFocus
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={() => handleRenameSaved(item.id, editTitle)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleRenameSaved(item.id, editTitle); if (e.key === "Escape") setEditingId(null); }}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs font-semibold text-[#e4e4e7] bg-transparent border-b border-[#5865f2] outline-none w-full"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#e4e4e7] truncate">{item.title || "Untitled"}</span>
                            <span className="text-[10px] rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[#71717a] font-medium shrink-0">{item.mode === "classic" ? "Classic" : "V2"}</span>
                          </div>
                        )}
                        <span className="text-[10px] text-[#52525b]">{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingId(item.id); setEditTitle(item.title || ""); }}
                        className="inline-flex items-center justify-center rounded-md h-7 w-7 text-[#52525b] hover:text-[#a1a1aa] hover:bg-white/[0.04] transition-colors shrink-0"
                      >
                        <Pencil className="size-3" />
                      </button>
                      <button
                        onClick={() => handleLoadSaved(item)}
                        className="inline-flex items-center gap-1 rounded-md h-7 px-2.5 text-[11px] font-medium bg-[#5865f2] text-white hover:bg-[#4752c4] transition-colors shrink-0"
                      >
                        <ExternalLink className="size-3" />
                        Load
                      </button>
                      <button
                        onClick={() => handleDeleteSaved(item.id)}
                        className="inline-flex items-center justify-center rounded-md h-7 w-7 text-[#52525b] hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                    {expandedId === item.id && (
                      <div className="border-t border-white/[0.06] bg-[#313338] p-3 max-h-[300px] overflow-y-auto">
                        <pre className="text-[10px] font-mono text-[#a1a1aa] whitespace-pre-wrap break-all">
                          {JSON.stringify(item.payload, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      <div className="fixed bottom-2 right-3 text-xs text-[#71717a]">
        Built with{" "}
        <img
          src="https://em-content.zobj.net/source/apple/391/red-heart_2764-fe0f.png"
          alt="❤️"
          className="inline-block h-3.5 w-3.5 align-[-2px]"
          draggable={false}
        />{" "}
        by{" "}
        <a
          href="https://rin.ms"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#a1a1aa] hover:text-white transition-colors"
        >
          rin.ms
        </a>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
