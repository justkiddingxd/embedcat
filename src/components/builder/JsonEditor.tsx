"use client";

import { useState, useEffect } from "react";
import { useBuilderStore } from "@/store/builder-store";
import { buildClassicPayload, buildComponentsV2Payload } from "@/lib/build-payload";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Code2, Copy, Check, Upload } from "lucide-react";

export function JsonEditor() {
  const { mode, content, embeds, components, webhook, jsonEditorOpen, setJsonEditorOpen, importFromJson } =
    useBuilderStore();
  const [jsonText, setJsonText] = useState("");
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    if (!jsonEditorOpen) return;
    const payload =
      mode === "classic"
        ? buildClassicPayload(content, embeds, webhook)
        : buildComponentsV2Payload(components, webhook);
    setJsonText(JSON.stringify(payload, null, 2));
    setImportError(null);
  }, [jsonEditorOpen, mode, content, embeds, components, webhook]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = () => {
    const success = importFromJson(jsonText);
    if (success) {
      setImportError(null);
      setJsonEditorOpen(false);
    } else {
      setImportError("Invalid JSON format");
    }
  };

  return (
    <Dialog open={jsonEditorOpen} onOpenChange={setJsonEditorOpen}>
      <DialogTrigger
        className="inline-flex h-7 items-center gap-2 rounded-full border border-white/[0.06] px-2.5 text-[0.8rem] font-medium text-[#71717a] hover:bg-white/[0.04] hover:text-[#a1a1aa] transition-colors"
      >
        <Code2 className="size-3.5" />
        JSON
      </DialogTrigger>
      <DialogContent className="max-w-2xl border-white/[0.08] bg-[#111113] text-[#fafafa]">
        <DialogHeader>
          <DialogTitle className="text-[#fafafa]">JSON Editor</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <textarea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setImportError(null);
            }}
            spellCheck={false}
            className="h-96 w-full resize-none rounded-md border border-white/[0.06] bg-[#0a0a0b] p-3 font-mono text-sm text-[#e4e4e7] focus:outline-none focus:ring-1 focus:ring-[#5865f2]"
          />
          {importError && (
            <p className="text-sm text-red-400">{importError}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-2 border-white/[0.06] text-[#a1a1aa] hover:bg-white/[0.04] transition-colors"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button
              size="sm"
              onClick={handleImport}
              className="gap-2 bg-[#5865f2] text-white hover:bg-[#4752c4] transition-colors"
            >
              <Upload className="size-4" />
              Import JSON
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
