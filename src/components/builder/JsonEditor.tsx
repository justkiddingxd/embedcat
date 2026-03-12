"use client";

import { useState, useEffect, useCallback } from "react";
import { useBuilderStore } from "@/store/builder-store";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  buildClassicPayload,
  buildComponentsV2Payload,
  buildNadekoPayload,
  buildDiscohookPayload,
} from "@/lib/build-payload";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Code2, Copy, Check, Upload } from "lucide-react";
import { useToast } from "@/components/ui/toast";

type JsonFormat = "embedcat" | "nadeko" | "discohook";

const FORMAT_LABELS: Record<JsonFormat, string> = {
  embedcat: "embed.cat",
  nadeko: "Nadeko",
  discohook: "Discohook",
};

export function JsonEditor() {
  const store = useBuilderStore();
  const { t } = useLocale();
  const { toast } = useToast();
  const { mode, content, embeds, components, webhook, jsonEditorOpen, setJsonEditorOpen, importFromJson } = store;
  const [jsonText, setJsonText] = useState("");
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [format, setFormat] = useState<JsonFormat>("embedcat");

  const buildJson = useCallback(
    (fmt: JsonFormat) => {
      if (mode === "classic") {
        switch (fmt) {
          case "nadeko":
            return JSON.stringify(buildNadekoPayload(content, embeds), null, 2);
          case "discohook":
            return JSON.stringify(buildDiscohookPayload(content, embeds), null, 2);
          default:
            return JSON.stringify(buildClassicPayload(content, embeds, webhook), null, 2);
        }
      }
      return JSON.stringify(buildComponentsV2Payload(components, webhook), null, 2);
    },
    [mode, content, embeds, components, webhook]
  );

  useEffect(() => {
    if (!jsonEditorOpen) return;
    setJsonText(buildJson(format));
    setImportError(null);
  }, [jsonEditorOpen, buildJson, format]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonText);
    setCopied(true);
    toast(t.toast.copied);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(jsonText);

      if (format === "nadeko" && mode === "classic") {
        const converted: Record<string, unknown> = {};
        if (data.plainText) converted.content = data.plainText;
        const embed: Record<string, unknown> = {};
        if (data.title) embed.title = data.title;
        if (data.description) embed.description = data.description;
        if (data.url) embed.url = data.url;
        if (data.color !== undefined) embed.color = data.color;
        if (data.author) embed.author = data.author;
        if (data.footer) embed.footer = data.footer;
        if (typeof data.thumbnail === "string") embed.thumbnail = { url: data.thumbnail };
        if (typeof data.image === "string") embed.image = { url: data.image };
        if (data.fields) embed.fields = data.fields;
        if (Object.keys(embed).length > 0) converted.embeds = [embed];
        const success = importFromJson(JSON.stringify(converted));
        if (success) { setImportError(null); setJsonEditorOpen(false); }
        else setImportError(t.jsonEditor.failedNadeko);
        return;
      }

      if (format === "discohook" && mode === "classic") {
        const success = importFromJson(JSON.stringify(data));
        if (success) { setImportError(null); setJsonEditorOpen(false); }
        else setImportError(t.jsonEditor.failedDiscohook);
        return;
      }

      const success = importFromJson(jsonText);
      if (success) { setImportError(null); setJsonEditorOpen(false); }
      else setImportError(t.jsonEditor.invalidFormat);
    } catch {
      setImportError(t.jsonEditor.invalidJson);
    }
  };

  const showFormatTabs = mode === "classic";

  return (
    <Dialog open={jsonEditorOpen} onOpenChange={setJsonEditorOpen}>
      <DialogTrigger
        className="inline-flex h-7 items-center gap-2 rounded-full border border-white/[0.06] px-2.5 text-[0.8rem] font-medium text-[#71717a] hover:bg-white/[0.04] hover:text-[#a1a1aa] transition-colors"
      >
        <Code2 className="size-3.5" />
        JSON
      </DialogTrigger>
      <DialogContent className="max-w-3xl border-white/[0.08] bg-[#111113] text-[#fafafa]">
        <DialogHeader>
          <DialogTitle className="text-[#fafafa]">{t.jsonEditor.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {showFormatTabs && (
            <div className="flex gap-1 rounded-lg bg-white/[0.04] p-1">
              {(Object.keys(FORMAT_LABELS) as JsonFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    format === fmt
                      ? "bg-[#5865f2] text-white"
                      : "text-[#71717a] hover:text-[#a1a1aa] hover:bg-white/[0.04]"
                  }`}
                >
                  {FORMAT_LABELS[fmt]}
                </button>
              ))}
            </div>
          )}
          <textarea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setImportError(null);
            }}
            spellCheck={false}
            className="h-[480px] w-full resize-none rounded-md border border-white/[0.06] bg-[#0a0a0b] p-3 font-mono text-sm text-[#e4e4e7] focus:outline-none focus:ring-1 focus:ring-[#5865f2]"
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
              {copied ? t.jsonEditor.copied : t.jsonEditor.copy}
            </Button>
            <Button
              size="sm"
              onClick={handleImport}
              className="gap-2 bg-[#5865f2] text-white hover:bg-[#4752c4] transition-colors"
            >
              <Upload className="size-4" />
              {t.jsonEditor.import}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
