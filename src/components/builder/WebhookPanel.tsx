"use client";

import { useState } from "react";
import { useBuilderStore } from "@/store/builder-store";
import { buildClassicPayload, buildComponentsV2Payload, sendWebhookMessage } from "@/lib/build-payload";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Send, ChevronDown, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { LIMITS } from "@/types/discord";

export function WebhookPanel() {
  const { webhook, setWebhook, mode, content, embeds, components } = useBuilderStore();
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);

  const handleSend = async () => {
    if (!webhook.url) return;
    setSending(true);
    setResult(null);

    const payload =
      mode === "classic"
        ? buildClassicPayload(content, embeds, webhook)
        : buildComponentsV2Payload(components, webhook);

    const res = await sendWebhookMessage(webhook, payload);
    setResult(res);
    setSending(false);

    if (res.success) {
      setTimeout(() => setResult(null), 3000);
    }
  };

  const isValidUrl = /^https:\/\/(canary\.|ptb\.)?discord\.com\/api\/webhooks\/\d+\/.+$/.test(webhook.url);

  return (
    <div className="space-y-2 rounded-lg border border-white/[0.06] bg-[#111113] p-3">
      <div className="flex items-center gap-2">
        <Input
          placeholder="https://discord.com/api/webhooks/..."
          value={webhook.url}
          onChange={(e) => setWebhook({ url: e.target.value })}
          className="flex-1 border-white/[0.06] bg-[#0a0a0b] text-[#fafafa] placeholder:text-[#52525b]"
        />
        <Button
          onClick={handleSend}
          disabled={sending || !isValidUrl}
          className="gap-2 bg-[#5865f2] text-white hover:bg-[#4752c4] disabled:opacity-50 transition-colors"
        >
          {sending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          Send
        </Button>
      </div>

      {result && (
        <div
          className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
            result.success
              ? "bg-green-900/30 text-green-400"
              : "bg-red-900/30 text-red-400"
          }`}
        >
          {result.success ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <AlertCircle className="size-4" />
          )}
          {result.success ? "Message sent!" : result.error}
        </div>
      )}

      <Collapsible open={optionsOpen} onOpenChange={setOptionsOpen}>
        <CollapsibleTrigger className="flex items-center gap-1 text-xs text-[#71717a] hover:text-[#a1a1aa] transition-colors">
          <ChevronDown
            className={`size-3.5 transition-transform duration-200 ${optionsOpen ? "rotate-0" : "-rotate-90"}`}
          />
          Webhook Options
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#52525b]">Username Override</label>
              <Input
                placeholder="embed.cat"
                value={webhook.username || ""}
                onChange={(e) => setWebhook({ username: e.target.value })}
                maxLength={LIMITS.WEBHOOK_USERNAME}
                className="border-white/[0.06] bg-[#0a0a0b] text-[#fafafa] placeholder:text-[#52525b]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#52525b]">Avatar URL</label>
              <Input
                placeholder="https://..."
                value={webhook.avatar_url || ""}
                onChange={(e) => setWebhook({ avatar_url: e.target.value })}
                className="border-white/[0.06] bg-[#0a0a0b] text-[#fafafa] placeholder:text-[#52525b]"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#52525b]">Thread ID (optional)</label>
            <Input
              placeholder="Thread or forum post ID"
              value={webhook.thread_id || ""}
              onChange={(e) => setWebhook({ thread_id: e.target.value })}
              className="border-white/[0.06] bg-[#0a0a0b] text-[#fafafa] placeholder:text-[#52525b]"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
