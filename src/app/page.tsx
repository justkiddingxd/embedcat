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
      <div className="flex flex-1 overflow-hidden">
        <div className="flex w-1/2 flex-col border-r border-white/[0.06]">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
            <div className="flex items-center gap-1 rounded-full bg-[#111113] p-0.5 ring-1 ring-white/[0.06]">
              <button
                onClick={() => setMode("classic")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 ${
                  mode === "classic"
                    ? "bg-[#5865f2] text-white shadow-sm shadow-[#5865f2]/20"
                    : "text-[#71717a] hover:text-[#a1a1aa]"
                }`}
              >
                <Layers className="size-3" />
                Classic Embed
              </button>
              <button
                onClick={() => setMode("components_v2")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 ${
                  mode === "components_v2"
                    ? "bg-[#5865f2] text-white shadow-sm shadow-[#5865f2]/20"
                    : "text-[#71717a] hover:text-[#a1a1aa]"
                }`}
              >
                <Box className="size-3" />
                Components V2
              </button>
            </div>
            <div className="flex items-center gap-1.5">
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
            <div className="p-3 space-y-2">
              <WebhookPanel />
              {mode === "classic" ? <ClassicBuilder /> : <ComponentsV2Editor />}
            </div>
          </div>
        </div>

        <div className="flex w-1/2 flex-col bg-[#09090b]">
          <div className="flex items-center border-b border-white/[0.06] px-4 py-2.5">
            <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#52525b]">
              Preview
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-3">
              <div className="rounded-lg border border-white/[0.04] shadow-lg shadow-black/20 overflow-hidden">
                <MessagePreview />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
