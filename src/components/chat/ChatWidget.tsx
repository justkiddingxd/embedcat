"use client";

import type { ReactNode } from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, X, Send, List, Plus, Trash2, Check, Pencil } from "lucide-react";
import { useSession } from "next-auth/react";
import { useLocale } from "@/lib/i18n/locale-context";
import { useBuilderStore } from "@/store/builder-store";
import { buildClassicPayload, buildComponentsV2Payload } from "@/lib/build-payload";
import type { BuilderMode } from "@/types/discord";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
}

function stripLeakedJson(text: string): string {
  let result = text;
  result = result.replace(/```(\w*)\n?[\s\S]*?```/g, "");
  result = result.replace(/\{[\s\n]*"(?:mode|content|embeds|components|title|description|color|type|fields)"[\s\S]*?\n\}/g, "");
  result = result.replace(/^\s*\{[\s\S]*\}\s*$/gm, (match) => {
    try { JSON.parse(match); return ""; } catch { return match; }
  });
  result = result.replace(/\n{3,}/g, "\n\n").trim();
  return result;
}

function renderMarkdown(text: string): ReactNode[] {
  const cleaned = stripLeakedJson(text);
  const parts: ReactNode[] = [];
  const inlineCodeBlockRegex = /`([^`]+)`/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIdx = 0;

  const lines = cleaned.split("\n");
  const filteredLines = lines.filter((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try { JSON.parse(trimmed); return false; } catch { void 0; }
    }
    if (trimmed.startsWith('"') && (trimmed.endsWith('",') || trimmed.endsWith('"'))) {
      if (/^\s*"[a-z_]+":\s*/.test(trimmed)) return false;
    }
    return true;
  });

  const finalText = filteredLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!finalText) return parts;

  parts.push(...renderInline(finalText, keyIdx));
  return parts;
}

function renderInline(text: string, startKey: number): ReactNode[] {
  const parts: ReactNode[] = [];
  let key = startKey;

  const lines = text.split("\n");
  lines.forEach((line, li) => {
    const inlineRegex = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+?)`)/g;
    let lastIdx = 0;
    let inMatch: RegExpExecArray | null;

    while ((inMatch = inlineRegex.exec(line)) !== null) {
      if (inMatch.index > lastIdx) {
        parts.push(<span key={key++}>{line.slice(lastIdx, inMatch.index)}</span>);
      }
      if (inMatch[2]) {
        parts.push(<strong key={key++} className="font-semibold">{inMatch[2]}</strong>);
      } else if (inMatch[3]) {
        parts.push(<em key={key++}>{inMatch[3]}</em>);
      } else if (inMatch[4]) {
        parts.push(
          <code key={key++} className="bg-[#0a0a0b] px-1 py-0.5 rounded text-[11px] font-mono">
            {inMatch[4]}
          </code>
        );
      }
      lastIdx = inMatch.index + inMatch[0].length;
    }

    if (lastIdx < line.length) {
      parts.push(<span key={key++}>{line.slice(lastIdx)}</span>);
    }

    if (li < lines.length - 1) {
      parts.push(<br key={key++} />);
    }
  });

  return parts;
}

function extractEmbedJsonBlocks(content: string): string[] {
  const blocks: string[] = [];
  const regex = /```(?:embed-json|json)?\n?([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(content)) !== null) {
    const trimmed = m[1].trim();
    if (!trimmed.startsWith("{")) continue;
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.embeds || parsed.components || parsed.content !== undefined) {
        blocks.push(trimmed);
      }
    } catch {
      void 0;
    }
  }
  return blocks;
}

export function ChatWidget() {
  const { data: authSession } = useSession();
  const { t } = useLocale();
  const { mode, content, embeds, components, webhook, loadFromPayload } = useBuilderStore();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [appliedBlocks, setAppliedBlocks] = useState<Set<string>>(new Set());
  const [rateLimited, setRateLimited] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [confirmDeleteSessionId, setConfirmDeleteSessionId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editSessionTitle, setEditSessionTitle] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = localStorage.getItem("embedcat-ai-hint");
    if (!dismissed) setShowHint(true);
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typewriterBuffer = useRef("");
  const typewriterShown = useRef(0);
  const typewriterRaf = useRef<number | null>(null);
  const typewriterMsgId = useRef<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const resizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const [panelSize, setPanelSize] = useState({ w: 380, h: 520 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("embedcat-chat-size");
      if (stored) {
        const parsed = JSON.parse(stored) as { w: number; h: number };
        setPanelSize({
          w: Math.max(320, Math.min(600, parsed.w)),
          h: Math.max(350, Math.min(800, parsed.h)),
        });
      }
    } catch {
      void 0;
    }
  }, []);

  const onResizePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      resizing.current = true;
      resizeStart.current = { x: e.clientX, y: e.clientY, w: panelSize.w, h: panelSize.h };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [panelSize]
  );

  const onResizePointerMove = useCallback((e: React.PointerEvent) => {
    if (!resizing.current) return;
    const dx = resizeStart.current.x - e.clientX;
    const dy = resizeStart.current.y - e.clientY;
    setPanelSize({
      w: Math.max(320, Math.min(600, resizeStart.current.w + dx)),
      h: Math.max(350, Math.min(800, resizeStart.current.h + dy)),
    });
  }, []);

  const onResizePointerUp = useCallback((e: React.PointerEvent) => {
    if (!resizing.current) return;
    resizing.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    const dx = resizeStart.current.x - e.clientX;
    const dy = resizeStart.current.y - e.clientY;
    const final = {
      w: Math.max(320, Math.min(600, resizeStart.current.w + dx)),
      h: Math.max(350, Math.min(800, resizeStart.current.h + dy)),
    };
    setPanelSize(final);
    localStorage.setItem("embedcat-chat-size", JSON.stringify(final));
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && !showSessions) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, showSessions]);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data as ChatSession[]);
      }
    } catch {
      void 0;
    }
  }, []);

  const fetchMessages = useCallback(async (sid: string) => {
    try {
      const res = await fetch(`/api/chat/sessions/${sid}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data as ChatMessage[]);
      }
    } catch {
      void 0;
    }
  }, []);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setError(null);
    if (showHint) {
      setShowHint(false);
      localStorage.setItem("embedcat-ai-hint", "1");
    }
    if (authSession?.user) {
      fetchSessions();
    }
  }, [authSession, fetchSessions, showHint]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setShowSessions(false);
  }, []);

  const handleNewChat = useCallback(() => {
    setSessionId(null);
    setMessages([]);
    setShowSessions(false);
    setError(null);
    setAppliedBlocks(new Set());
  }, []);

  const handleSelectSession = useCallback(
    async (sid: string) => {
      setSessionId(sid);
      setShowSessions(false);
      setError(null);
      setAppliedBlocks(new Set());
      await fetchMessages(sid);
    },
    [fetchMessages]
  );

  const handleDeleteSession = useCallback(
    async (sid: string) => {
      if (confirmDeleteSessionId !== sid) {
        setConfirmDeleteSessionId(sid);
        return;
      }
      setConfirmDeleteSessionId(null);
      try {
        await fetch(`/api/chat/sessions/${sid}`, { method: "DELETE" });
        setSessions((prev) => prev.filter((s) => s.id !== sid));
        if (sessionId === sid) {
          setSessionId(null);
          setMessages([]);
        }
      } catch {
        void 0;
      }
    },
    [sessionId, confirmDeleteSessionId]
  );

  const handleRenameSession = useCallback(
    async (sid: string, title: string) => {
      setEditingSessionId(null);
      if (!title.trim()) return;
      try {
        await fetch(`/api/chat/sessions/${sid}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: title.trim() }),
        });
        setSessions((prev) =>
          prev.map((s) => (s.id === sid ? { ...s, title: title.trim() } : s))
        );
      } catch {
        void 0;
      }
    },
    []
  );

  const getEmbedContext = useCallback((): string => {
    try {
      if (mode === "classic") {
        return JSON.stringify(buildClassicPayload(content, embeds, webhook));
      }
      return JSON.stringify(buildComponentsV2Payload(components, webhook));
    } catch {
      return "{}";
    }
  }, [mode, content, embeds, components, webhook]);

  const handleSend = useCallback(
    async (e?: { preventDefault: () => void }) => {
      if (e) e.preventDefault();
      const trimmed = input.trim();
      if (!trimmed || isStreaming) return;

      setError(null);
      setInput("");
      if (inputRef.current) inputRef.current.style.height = "auto";

      const userMsg: ChatMessage = {
        id: `tmp-${Date.now()}`,
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      setIsStreaming(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            sessionId,
            embedContext: getEmbedContext(),
          }),
        });

        if (!res.ok) {
          setMessages((prev) => prev.filter((m) => m.id !== aiMsg.id));
          try {
            const errData = await res.json() as { error?: string };
            if (res.status === 429) {
              setError(t.chat.dailyLimitError);
              setRateLimited(true);
            } else if (res.status === 401) {
              setError(t.chat.signInError);
            } else {
              setError(errData.error || t.chat.somethingWentWrong);
            }
          } catch {
            setError(t.chat.somethingWentWrong);
          }
          setIsStreaming(false);
          return;
        }

        const newSessionId = res.headers.get("X-Chat-Session-Id");
        if (newSessionId && !sessionId) {
          setSessionId(newSessionId);
        }

        const reader = res.body?.getReader();
        if (!reader) {
          setIsStreaming(false);
          return;
        }

        const decoder = new TextDecoder();
        typewriterBuffer.current = "";
        typewriterShown.current = 0;
        typewriterMsgId.current = aiMsg.id;

        const tick = () => {
          const buf = typewriterBuffer.current;
          const shown = typewriterShown.current;
          if (shown < buf.length) {
            const step = Math.max(1, Math.min(3, Math.ceil((buf.length - shown) / 10)));
            const next = Math.min(shown + step, buf.length);
            typewriterShown.current = next;
            const visible = buf.slice(0, next);
            setMessages((prev) =>
              prev.map((m) => (m.id === typewriterMsgId.current ? { ...m, content: visible } : m))
            );
          }
          typewriterRaf.current = requestAnimationFrame(tick);
        };
        typewriterRaf.current = requestAnimationFrame(tick);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          typewriterBuffer.current += decoder.decode(value, { stream: true });
        }

        const waitForTypewriter = () => new Promise<void>((resolve) => {
          const check = () => {
            if (typewriterShown.current >= typewriterBuffer.current.length) {
              resolve();
            } else {
              requestAnimationFrame(check);
            }
          };
          check();
        });
        await waitForTypewriter();

        if (typewriterRaf.current) {
          cancelAnimationFrame(typewriterRaf.current);
          typewriterRaf.current = null;
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsg.id ? { ...m, content: typewriterBuffer.current } : m
          )
        );
      } catch {
        setError(t.chat.failedToSend);
        setMessages((prev) => prev.filter((m) => m.id !== aiMsg.id));
      } finally {
        setIsStreaming(false);
      }
    },
    [input, isStreaming, sessionId, getEmbedContext]
  );

  const handleApplyEmbed = useCallback(
    (jsonStr: string) => {
      try {
        const payload = JSON.parse(jsonStr) as Record<string, unknown>;
        let targetMode: BuilderMode = "classic";
        if (payload.components && !payload.embeds) {
          targetMode = "components_v2";
        }
        loadFromPayload(targetMode, payload);
        setAppliedBlocks((prev) => new Set(prev).add(jsonStr));
      } catch {
        void 0;
      }
    },
    [loadFromPayload]
  );

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  return (
    <>
      {showHint && !isOpen && (
        <div className="fixed bottom-[78px] right-[18px] z-50 animate-fade-in-hint pointer-events-none">
          <div className="relative bg-[#5865f2] text-white text-[11px] font-medium px-3 py-1.5 rounded-lg shadow-lg shadow-black/30 whitespace-nowrap">
            {t.chat.letAiHelp}
            <svg className="absolute -bottom-[6px] right-3 text-[#5865f2]" width="12" height="7" viewBox="0 0 12 7" fill="currentColor">
              <path d="M0 0L6 7L12 0H0Z" />
            </svg>
          </div>
        </div>
      )}
      <button
        onClick={isOpen ? handleClose : handleOpen}
        className={[
          "fixed bottom-8 right-3 z-50 w-10 h-10 rounded-full flex items-center justify-center",
          "bg-[#5865f2] text-white shadow-lg shadow-black/40",
          "transition-all duration-200 hover:scale-110 hover:shadow-xl hover:shadow-black/50",
          "active:scale-95",
        ].join(" ")}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? <X className="w-4.5 h-4.5" /> : <Bot className="w-5 h-5" />}
      </button>

      <div
        ref={panelRef}
        className={[
          "fixed z-50",
          isMobile ? "inset-3 bottom-14" : "bottom-12 right-3",
          "bg-[#111113] border border-white/[0.08] rounded-xl",
          "shadow-2xl shadow-black/60 flex flex-col overflow-hidden",
          "transition-[opacity,transform] duration-300 ease-out origin-bottom-right",
          isOpen
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
            : "opacity-0 translate-y-4 scale-95 pointer-events-none",
        ].join(" ")}
        style={isMobile ? undefined : { width: panelSize.w, height: panelSize.h }}
      >
        {!isMobile && (
          <div
            onPointerDown={onResizePointerDown}
            onPointerMove={onResizePointerMove}
            onPointerUp={onResizePointerUp}
            className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize z-10"
          />
        )}
        <div className="h-10 flex items-center justify-between px-3 border-b border-white/[0.06] shrink-0">
          <span className="text-[13px] font-medium text-[#e4e4e7] tracking-tight">
            {t.chat.aiTitle}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setShowSessions(!showSessions);
                if (!showSessions) fetchSessions();
              }}
              className="w-7 h-7 rounded-md flex items-center justify-center text-[#71717a] hover:text-[#e4e4e7] hover:bg-white/[0.06] transition-colors"
              aria-label="Sessions"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleClose}
              className="w-7 h-7 rounded-md flex items-center justify-center text-[#71717a] hover:text-[#e4e4e7] hover:bg-white/[0.06] transition-colors"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {showSessions ? (
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-2">
              <button
                onClick={handleNewChat}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium text-[#5865f2] hover:bg-[#5865f2]/10 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                {t.chat.newChat}
              </button>
            </div>
            <div className="px-2 pb-2 space-y-0.5">
              {sessions.length === 0 && (
                <div className="text-center py-8 text-[11px] text-[#71717a]">
                  {t.chat.noPreviousChats}
                </div>
              )}
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className={[
                    "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                    s.id === sessionId
                      ? "bg-[#5865f2]/10 text-[#e4e4e7]"
                      : "text-[#a1a1aa] hover:bg-white/[0.04] hover:text-[#e4e4e7]",
                  ].join(" ")}
                  onClick={() => {
                    if (editingSessionId !== s.id) handleSelectSession(s.id);
                  }}
                >
                  <div className="flex-1 min-w-0">
                    {editingSessionId === s.id ? (
                      <input
                        autoFocus
                        value={editSessionTitle}
                        onChange={(e) => setEditSessionTitle(e.target.value)}
                        onBlur={() => handleRenameSession(s.id, editSessionTitle)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameSession(s.id, editSessionTitle);
                          if (e.key === "Escape") setEditingSessionId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[12px] font-medium text-[#e4e4e7] bg-transparent border-b border-[#5865f2] outline-none w-full"
                      />
                    ) : (
                      <div className="text-[12px] font-medium truncate">
                        {s.title || t.chat.untitled}
                      </div>
                    )}
                    <div className="text-[10px] text-[#71717a] mt-0.5">
                      {formatDate(s.updatedAt)} &middot; {s._count.messages} {t.chat.msgs}
                    </div>
                  </div>
                  <button
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setEditingSessionId(s.id);
                      setEditSessionTitle(s.title || "");
                    }}
                    className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center text-[#71717a] hover:text-[#a1a1aa] hover:bg-white/[0.06] transition-all shrink-0"
                    aria-label="Rename session"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <div className="relative shrink-0">
                    {confirmDeleteSessionId === s.id && (
                      <div className="absolute bottom-full right-0 mb-1 z-10 whitespace-nowrap rounded-md bg-red-500/15 border border-red-500/25 px-2 py-1 text-[10px] font-medium text-red-400" style={{ animation: "confirmFadeIn 150ms ease-out" }}>
                        {t.chat.youSure}
                      </div>
                    )}
                    <button
                      onClick={(ev) => {
                        ev.stopPropagation();
                        handleDeleteSession(s.id);
                      }}
                      onBlur={() => { if (confirmDeleteSessionId === s.id) setConfirmDeleteSessionId(null); }}
                      className={[
                        "w-6 h-6 rounded flex items-center justify-center transition-all",
                        confirmDeleteSessionId === s.id
                          ? "text-red-400 bg-red-400/10"
                          : "opacity-0 group-hover:opacity-100 text-[#71717a] hover:text-red-400 hover:bg-red-400/10",
                      ].join(" ")}
                      aria-label="Delete session"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto min-h-0 px-3 py-3 space-y-3">
              {messages.length === 0 && !error && (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="w-10 h-10 rounded-xl bg-[#5865f2]/10 flex items-center justify-center mb-3">
                    <Bot className="w-5 h-5 text-[#5865f2]" />
                  </div>
                  <p className="text-[12px] text-[#71717a] leading-relaxed max-w-[240px]">
                    {t.chat.aiWelcome}
                  </p>
                </div>
              )}

              {messages.map((msg) => {
                const isUser = msg.role === "user";
                const embedBlocks = !isUser ? extractEmbedJsonBlocks(msg.content) : [];

                return (
                  <div
                    key={msg.id}
                    className={[
                      "flex flex-col max-w-[85%]",
                      isUser ? "ml-auto items-end" : "mr-auto items-start",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "rounded-xl px-3 py-2 text-[12px] leading-[1.55]",
                        isUser
                          ? "bg-[#5865f2]/15 text-[#e4e4e7]"
                          : "bg-white/[0.04] text-[#e4e4e7]",
                      ].join(" ")}
                    >
                      {isUser ? (
                        msg.content
                      ) : msg.content ? (
                        renderMarkdown(msg.content)
                      ) : (
                        <span className="inline-flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#71717a] animate-pulse" />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#71717a] animate-pulse [animation-delay:150ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#71717a] animate-pulse [animation-delay:300ms]" />
                        </span>
                      )}
                    </div>

                    {embedBlocks.map((block, bi) => (
                      <button
                        key={`apply-${msg.id}-${bi}`}
                        onClick={() => handleApplyEmbed(block)}
                        disabled={appliedBlocks.has(block)}
                        className={[
                          "mt-1.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all",
                          appliedBlocks.has(block)
                            ? "bg-emerald-500/10 text-emerald-400 cursor-default"
                            : "bg-[#5865f2]/10 text-[#5865f2] hover:bg-[#5865f2]/20 active:scale-95",
                        ].join(" ")}
                      >
                        {appliedBlocks.has(block) ? (
                          <>
                            <Check className="w-3 h-3" />
                            {t.chat.applied}
                          </>
                        ) : (
                          t.chat.applyEmbed
                        )}
                      </button>
                    ))}

                    <span className="text-[10px] text-[#71717a] mt-1 px-1">
                      {formatDate(msg.createdAt)}
                    </span>
                  </div>
                );
              })}

              {error && (
                <div className="mx-auto px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 text-center max-w-[280px]">
                  {error}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={handleSend}
              className="shrink-0 px-3 pb-3 pt-1"
            >
              <div className="relative flex items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    const val = e.target.value.slice(0, 3000);
                    setInput(val);
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                  }}
                  placeholder={
                    !authSession?.user
                      ? t.chat.signInToChat
                      : rateLimited
                        ? t.chat.dailyLimitReached
                        : t.chat.typeMessage
                  }
                  disabled={isStreaming || !authSession?.user || rateLimited}
                  rows={1}
                  className={[
                    "w-full min-h-[36px] max-h-[120px] pl-3 pr-9 py-2 rounded-lg text-[12px] text-[#e4e4e7] placeholder-[#52525b]",
                    "bg-[#0a0a0b] border border-white/[0.06] resize-none",
                    "outline-none focus:border-[#5865f2]/40 transition-colors",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                  ].join(" ")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isStreaming || !authSession?.user || rateLimited}
                  className={[
                    "absolute right-1.5 bottom-1.5 w-6 h-6 rounded-md flex items-center justify-center transition-all",
                    input.trim() && !isStreaming
                      ? "text-[#5865f2] hover:bg-[#5865f2]/10"
                      : "text-[#52525b] cursor-not-allowed",
                  ].join(" ")}
                  aria-label="Send message"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
              {input.length > 2500 && (
                <div className="text-[10px] text-[#71717a] mt-1 text-right px-1">
                  {input.length}/3000
                </div>
              )}
            </form>
          </>
        )}
      </div>
    </>
  );
}
