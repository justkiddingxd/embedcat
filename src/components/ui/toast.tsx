"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  leaving: boolean;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => void 0 });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

const ICON_MAP: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />,
  error: <XCircle className="size-4 text-red-400 shrink-0" />,
  info: <Info className="size-4 text-[#5865f2] shrink-0" />,
};

const BORDER_MAP: Record<ToastType, string> = {
  success: "border-emerald-500/20",
  error: "border-red-500/20",
  info: "border-[#5865f2]/20",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = ++nextId;
      setToasts((prev) => {
        const next = [...prev, { id, message, type, leaving: false }];
        if (next.length > 3) return next.slice(-3);
        return next;
      });
      setTimeout(() => dismiss(id), 3000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2.5 rounded-lg border ${BORDER_MAP[t.type]} bg-[#111113] px-3.5 py-2.5 shadow-lg shadow-black/40 transition-all duration-200 ${t.leaving ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0 animate-in slide-in-from-bottom-2 fade-in"}`}
          >
            {ICON_MAP[t.type]}
            <span className="text-sm text-[#e4e4e7]">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="ml-1 text-[#52525b] hover:text-[#a1a1aa] transition-colors shrink-0"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
