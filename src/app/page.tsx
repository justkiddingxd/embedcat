"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBuilderStore } from "@/store/builder-store";
import { useLocale } from "@/lib/i18n/locale-context";
import { Header } from "@/components/layout/Header";
import { ClassicBuilder } from "@/components/builder/ClassicBuilder";
import { ComponentsV2Editor } from "@/components/builder/ComponentsV2Editor";
import MessagePreview, {
  ClassicPreview,
  ComponentsV2Preview,
  MentionCtx,
} from "@/components/preview/MessagePreview";
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
import { RotateCcw, Layers, Box, AlertTriangle, Share2, Check, Trash2, ExternalLink, Bookmark, Pencil, ChevronDown, Undo2, Redo2 } from "lucide-react";
import { buildClassicPayload, buildComponentsV2Payload } from "@/lib/build-payload";
import { nanoid } from "nanoid";
import type { DiscordEmbed, EmbedField, TopLevelComponent } from "@/types/discord";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { useToast } from "@/components/ui/toast";

const STORAGE_KEY = "embedcat-preview-width";
const MIN_WIDTH = 280;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 600;

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

type PayloadObj = Record<string, unknown> & {
  content?: string;
  embeds?: Record<string, unknown>[];
  components?: Record<string, unknown>[];
};

function SavedEmbedPreview({ mode, payload }: { mode: string; payload: Record<string, unknown> }) {
  const parsed = useMemo(() => {
    const p = payload as PayloadObj;
    if (mode === "classic") {
      const content = (p.content as string) || "";
      const rawEmbeds = (p.embeds || []) as Record<string, unknown>[];
      const embeds: DiscordEmbed[] = rawEmbeds.map((e) => ({
        ...e,
        id: nanoid(),
        fields: ((e.fields || []) as Record<string, unknown>[]).map((f) => ({
          ...f,
          id: nanoid(),
        })),
      })) as unknown as DiscordEmbed[];
      return { content, embeds };
    }
    type JsonObj = Record<string, unknown> & {
      components?: JsonObj[];
      items?: JsonObj[];
    };
    const assignIds = (obj: JsonObj): JsonObj => {
      if (typeof obj !== "object" || obj === null) return obj;
      const result: JsonObj = { ...obj, id: nanoid() };
      if (Array.isArray(result.components)) {
        result.components = result.components.map((c) => assignIds(c));
      }
      if (Array.isArray(result.items)) {
        result.items = result.items.map((i) => assignIds(i));
      }
      return result;
    };
    const rawComponents = (p.components || []) as JsonObj[];
    const components = rawComponents.map((c) => assignIds(c)) as unknown as TopLevelComponent[];
    return { components };
  }, [mode, payload]);

  const dummyResolver = useMemo(() => ({
    resolveUser: () => null,
    resolveRole: () => null,
  }), []);

  return (
    <MentionCtx.Provider value={dummyResolver}>
      <div className="border-t border-white/[0.06] bg-[#313338] p-3 max-h-[300px] overflow-y-auto">
        {mode === "classic" ? (
          <ClassicPreview
            content={(parsed as { content: string; embeds: DiscordEmbed[] }).content}
            embeds={(parsed as { content: string; embeds: DiscordEmbed[] }).embeds}
          />
        ) : (
          <ComponentsV2Preview
            components={(parsed as { components: TopLevelComponent[] }).components}
          />
        )}
      </div>
    </MentionCtx.Provider>
  );
}

function ModeToggle({ mode, onModeChange, labels }: { mode: string; onModeChange: (m: "classic" | "components_v2") => void; labels: { classic: string; components: string } }) {
  const classicRef = useRef<HTMLButtonElement>(null);
  const componentsRef = useRef<HTMLButtonElement>(null);
  const [pill, setPill] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const el = mode === "classic" ? classicRef.current : componentsRef.current;
    if (!el) return;
    const measure = () => setPill({ left: el.offsetLeft, width: el.offsetWidth });
    measure();
    // Re-measure when the buttons resize, e.g. when the web font swaps in after a full reload.
    const ro = new ResizeObserver(measure);
    if (classicRef.current) ro.observe(classicRef.current);
    if (componentsRef.current) ro.observe(componentsRef.current);
    return () => ro.disconnect();
  }, [mode]);

  return (
    <div className="relative flex items-center gap-0.5 rounded-full bg-[#111113] p-0.5 ring-1 ring-white/[0.06]">
      <div
        className="absolute top-0.5 h-[calc(100%-4px)] rounded-full bg-[#5865f2] shadow-sm shadow-[#5865f2]/25 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ left: pill.left, width: pill.width }}
      />
      <button
        ref={classicRef}
        onClick={() => onModeChange("classic")}
        className={`relative z-[1] flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors duration-200 ${
          mode === "classic" ? "text-white" : "text-[#71717a] hover:text-[#a1a1aa]"
        }`}
      >
        <Layers className="size-3" />
        {labels.classic}
      </button>
      <button
        ref={componentsRef}
        onClick={() => onModeChange("components_v2")}
        className={`relative z-[1] flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors duration-200 ${
          mode === "components_v2" ? "text-white" : "text-[#71717a] hover:text-[#a1a1aa]"
        }`}
      >
        <Box className="size-3" />
        {labels.components}
      </button>
    </div>
  );
}

function HomeContent() {
  const { mode, setMode, reset, content, embeds, components, webhook, loadFromPayload, undo, redo, canUndo, canRedo } = useBuilderStore();
  const { t } = useLocale();
  const { toast } = useToast();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [previewWidth, setPreviewWidth] = useState(DEFAULT_WIDTH);
  const [isMobile, setIsMobile] = useState(false);
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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [currentSavedId, setCurrentSavedId] = useState<string | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    setPreviewWidth(loadWidth());
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (loadedRef.current) return;
    const id = searchParams.get("id");
    if (!id) return;
    loadedRef.current = true;
    fetch(`/api/embeds/${id}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data: SavedEmbedItem & { userId?: string }) => {
        if (data.mode && data.payload) {
          loadFromPayload(data.mode as "classic" | "components_v2", data.payload);
          const uid = (session?.user as { id?: string } | undefined)?.id;
          if (uid && data.userId === uid) setCurrentSavedId(id);
        }
      })
      .catch(() => { void 0; })
      .finally(() => {
        window.history.replaceState(null, "", window.location.pathname);
      });
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
        body: JSON.stringify({ mode, payload, title: embeds[0]?.title || "Untitled", saveToProfile: false }),
      });
      const data = (await res.json()) as { id: string };
      const url = `${window.location.origin}?id=${data.id}`;
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      toast(t.toast.linkCopied);
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
      if (currentSavedId) {
        await fetch(`/api/embeds/${currentSavedId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode, payload }),
        });
      } else {
        const res = await fetch("/api/embeds", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode, payload, title: embeds[0]?.title || "Untitled", saveToProfile: true }),
        });
        const data = (await res.json()) as { id: string };
        setCurrentSavedId(data.id);
      }
      setSaveStatus("saved");
      toast(t.toast.saved);
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
    setConfirmDeleteId(null);
    loadSaved();
  };

  const handleDeleteSaved = async (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setConfirmDeleteId(null);
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
    setCurrentSavedId(item.id);
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
      <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col overflow-hidden md:flex-row">
        <div className="flex min-h-0 flex-[3] flex-col overflow-hidden md:flex-1">
          <div className="flex min-h-9 h-auto flex-wrap items-center justify-between gap-y-1 border-b border-white/[0.06] px-3">
            <ModeToggle mode={mode} onModeChange={(m) => { setMode(m); setCurrentSavedId(null); }} labels={t.mode} />
            <div className="flex flex-wrap items-center gap-1">
              <button
                onClick={handleCopyLink}
                disabled={shareLoading}
                className="inline-flex h-7 items-center gap-1.5 rounded-full border border-white/[0.06] px-2.5 text-[0.8rem] font-medium text-[#71717a] hover:bg-white/[0.04] hover:text-[#a1a1aa] transition-colors disabled:opacity-50"
              >
                {shareCopied ? <Check className="size-3.5 text-emerald-400" /> : <Share2 className="size-3.5" />}
                {shareCopied ? t.toolbar.copied : t.toolbar.link}
              </button>
              {session?.user && (
                <button
                  onClick={handleSaveToProfile}
                  disabled={saveStatus === "saving"}
                  className="inline-flex h-7 items-center gap-1.5 rounded-full border border-white/[0.06] px-2.5 text-[0.8rem] font-medium text-[#71717a] hover:bg-white/[0.04] hover:text-[#a1a1aa] transition-colors disabled:opacity-50"
                >
                  {saveStatus === "saved" ? <Check className="size-3.5 text-emerald-400" /> : <Bookmark className="size-3.5" />}
                  {saveStatus === "saved" ? t.toolbar.saved : t.toolbar.save}
                </button>
              )}
              <JsonEditor />
              <button
                onClick={undo}
                disabled={!canUndo()}
                className="inline-flex items-center justify-center rounded-md h-7 w-7 text-[#71717a] hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-25 disabled:pointer-events-none"
                title={t.toolbar.undo}
              >
                <Undo2 className="size-3.5" />
              </button>
              <button
                onClick={redo}
                disabled={!canRedo()}
                className="inline-flex items-center justify-center rounded-md h-7 w-7 text-[#71717a] hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-25 disabled:pointer-events-none"
                title={t.toolbar.redo}
              >
                <Redo2 className="size-3.5" />
              </button>
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
                    <DialogTitle className="text-[#e4e4e7]">{t.reset.title}</DialogTitle>
                    <DialogDescription className="text-[#71717a]">
                      {t.reset.description}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="bg-transparent border-white/[0.06] flex-row gap-2 sm:justify-center">
                    <DialogClose
                      className="inline-flex items-center justify-center rounded-md h-8 px-4 text-xs font-medium bg-white/[0.06] text-[#a1a1aa] hover:bg-white/[0.1] hover:text-white transition-colors"
                    >
                      {t.reset.cancel}
                    </DialogClose>
                    <DialogClose
                      className="inline-flex items-center justify-center rounded-md h-8 px-4 text-xs font-medium bg-red-500/80 text-white hover:bg-red-500 transition-colors"
                      onClick={() => { reset(); setCurrentSavedId(null); window.history.replaceState(null, "", window.location.pathname); }}
                    >
                      {t.reset.delete}
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

        {!isMobile && (
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className="relative z-10 w-1 shrink-0 cursor-col-resize select-none group"
          >
            <div className="absolute inset-y-0 -left-1 -right-1" />
            <div className="h-full w-px mx-auto bg-white/[0.06] group-hover:bg-[#5865f2]/50 group-active:bg-[#5865f2] transition-colors" />
          </div>
        )}

        <div
          className="flex min-h-0 flex-[2] flex-col bg-[#09090b] md:flex-none md:shrink-0"
          style={isMobile ? undefined : { width: previewWidth }}
        >
          <div className="flex h-9 items-center border-b border-white/[0.06] px-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#52525b]">
              {t.preview.title}
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onMouseDown={(e) => { if (e.target === e.currentTarget) (e.currentTarget as HTMLElement).dataset.down = "1"; }}
          onMouseUp={(e) => {
            if (e.target === e.currentTarget && (e.currentTarget as HTMLElement).dataset.down === "1") setSavedOpen(false);
            (e.currentTarget as HTMLElement).dataset.down = "";
          }}
        >
          <div
            className="mx-3 w-[calc(100%-1.5rem)] max-w-2xl max-h-[85vh] min-h-[50vh] rounded-lg border border-white/[0.08] bg-[#111113] shadow-2xl shadow-black/60 flex flex-col sm:mx-0 sm:w-full"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <h2 className="text-sm font-semibold text-[#e4e4e7]">{t.savedEmbeds.title}</h2>
              <button onClick={() => setSavedOpen(false)} className="text-[#71717a] hover:text-white transition-colors text-lg leading-none">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {savedLoading ? (
                <p className="text-sm text-[#71717a] text-center py-8">{t.savedEmbeds.loading}</p>
              ) : savedEmbeds.length === 0 ? (
                <p className="text-sm text-[#71717a] text-center py-8">{t.savedEmbeds.noSaved}</p>
              ) : (
                savedEmbeds.map((item) => (
                  <div key={item.id} className="rounded-md bg-white/[0.03] border border-white/[0.06]">
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
                            <span className="text-xs font-semibold text-[#e4e4e7] truncate">{item.title || t.savedEmbeds.untitled}</span>
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
                        {t.savedEmbeds.load}
                      </button>
                      <div className="relative shrink-0">
                        {confirmDeleteId === item.id && (
                           <div className="absolute bottom-full right-0 mb-1 z-[9999] whitespace-nowrap rounded-md bg-red-500/15 border border-red-500/25 px-2 py-1 text-[10px] font-medium text-red-400" style={{ animation: "confirmFadeIn 150ms ease-out" }}>
                            {t.savedEmbeds.youSure}
                          </div>
                        )}
                        <button
                          onClick={() => handleDeleteSaved(item.id)}
                          onBlur={() => { if (confirmDeleteId === item.id) setConfirmDeleteId(null); }}
                          className={`inline-flex items-center justify-center rounded-md h-7 w-7 transition-colors ${confirmDeleteId === item.id ? "text-red-400 bg-red-500/10" : "text-[#52525b] hover:text-red-400 hover:bg-red-500/10"}`}
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </div>
                    {expandedId === item.id && (
                      <SavedEmbedPreview mode={item.mode} payload={item.payload} />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      <ChatWidget />
      <div className="fixed bottom-1 left-1/2 -translate-x-1/2 text-xs text-[#71717a] md:left-auto md:translate-x-0 md:right-3 md:bottom-2">
        {t.footer.builtWith}{" "}
        <img
          src="https://em-content.zobj.net/source/apple/391/red-heart_2764-fe0f.png"
          alt="❤️"
          className="inline-block h-3.5 w-3.5 align-[-2px]"
          draggable={false}
        />{" "}
        {t.footer.by}{" "}
        <a
          href="https://rin.ms"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#a1a1aa] hover:text-white transition-colors"
        >
          rin.ms
        </a>
        <span className="mx-1.5 text-[#3f3f46]">·</span>
        {t.footer.openSource}{" "}
        <a
          href="https://github.com/justkiddingxd/embedcat"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#a1a1aa] hover:text-white transition-colors"
        >
          GitHub
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
