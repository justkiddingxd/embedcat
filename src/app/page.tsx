"use client";

import { useBuilderStore } from "@/store/builder-store";
import { Header } from "@/components/layout/Header";
import { ClassicBuilder } from "@/components/builder/ClassicBuilder";
import { ComponentsV2Editor } from "@/components/builder/ComponentsV2Editor";
import MessagePreview from "@/components/preview/MessagePreview";
import { WebhookPanel } from "@/components/builder/WebhookPanel";
import { JsonEditor } from "@/components/builder/JsonEditor";
import { Button } from "@/components/ui/button";
import { RotateCcw, Layers, Box } from "lucide-react";

export default function Home() {
  const { mode, setMode, reset } = useBuilderStore();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#09090b]">
      <Header />
      <div className="mx-auto flex w-full max-w-[1400px] flex-1 overflow-hidden">
        <div className="flex w-[440px] shrink-0 flex-col border-r border-white/[0.06]">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-1.5">
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
                V2
              </button>
            </div>
            <div className="flex items-center gap-1">
              <JsonEditor />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={reset}
                className="text-[#71717a] hover:text-white transition-colors"
              >
                <RotateCcw className="size-3.5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-1.5">
              <WebhookPanel />
              {mode === "classic" ? <ClassicBuilder /> : <ComponentsV2Editor />}
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col bg-[#09090b]">
          <div className="flex items-center border-b border-white/[0.06] px-3 py-1.5">
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
