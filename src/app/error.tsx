"use client";

import { useEffect } from "react";
import { useLocale } from "@/lib/i18n/locale-context";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLocale();

  useEffect(() => {
    console.error("[embed.cat error]", error);
  }, [error]);

  return (
    <div className="flex h-screen items-center justify-center bg-[#09090b]">
      <div className="max-w-md space-y-4 rounded-lg border border-white/[0.08] bg-[#111113] p-6 text-center">
        <h2 className="text-lg font-semibold text-[#e4e4e7]">{t.error.somethingWentWrong}</h2>
        <pre className="max-h-40 overflow-auto rounded bg-[#0a0a0b] p-3 text-left text-[11px] text-red-400 font-mono whitespace-pre-wrap break-all">
          {error.message}
          {error.stack && `\n\n${error.stack}`}
        </pre>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-md bg-[#5865f2] px-4 py-2 text-sm font-medium text-white hover:bg-[#4752c4] transition-colors"
          >
            {t.error.tryAgain}
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="rounded-md bg-white/[0.06] px-4 py-2 text-sm font-medium text-[#a1a1aa] hover:bg-white/[0.1] hover:text-white transition-colors"
          >
            {t.error.clearDataReload}
          </button>
        </div>
      </div>
    </div>
  );
}
