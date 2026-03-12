"use client";

import { useState } from "react";
import { useBuilderStore } from "@/store/builder-store";
import { useLocale } from "@/lib/i18n/locale-context";
import { buildClassicPayload, buildComponentsV2Payload, sendWebhookMessage } from "@/lib/build-payload";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Send, ChevronDown, Loader2, CheckCircle2, AlertCircle, Check } from "lucide-react";
import { LIMITS } from "@/types/discord";
import { useToast } from "@/components/ui/toast";

export function WebhookPanel() {
  const { webhook, setWebhook, mode, content, embeds, components } = useBuilderStore();
  const { t } = useLocale();
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);

  const [showCheck, setShowCheck] = useState(false);

  const handleSend = async () => {
    if (!webhook.url) return;
    setSending(true);
    setResult(null);
    setShowCheck(false);

    const payload =
      mode === "classic"
        ? buildClassicPayload(content, embeds, webhook)
        : buildComponentsV2Payload(components, webhook);

    const res = await sendWebhookMessage(webhook, payload);
    setResult(res);
    setSending(false);

    if (res.success) {
      setShowCheck(true);
      toast(t.toast.embedSent);
      setTimeout(() => { setShowCheck(false); setResult(null); }, 2000);
    } else {
      toast(res.error || t.toast.sendError, "error");
    }
  };

  const isValidUrl = /^https:\/\/(canary\.|ptb\.)?discord\.com\/api\/webhooks\/\d+\/.+$/.test(webhook.url);

  return (
    <div className="space-y-1.5 rounded-md border border-white/[0.06] bg-[#111113] p-2">
      <div className="flex items-center gap-1.5">
        <Input
          placeholder={t.webhook.urlPlaceholder}
          value={webhook.url}
          onChange={(e) => setWebhook({ url: e.target.value })}
          className="h-7 flex-1 border-white/[0.06] bg-[#0a0a0b] text-xs text-[#fafafa] placeholder:text-[#52525b]"
        />
        <Button
          onClick={handleSend}
          disabled={sending || !isValidUrl}
          size="sm"
          className={`h-7 gap-1.5 px-3 text-xs text-white disabled:opacity-50 transition-colors ${showCheck ? "bg-emerald-600 hover:bg-emerald-600" : "bg-[#5865f2] hover:bg-[#4752c4]"}`}
        >
          {sending ? (
            <Loader2 className="size-3 animate-spin" />
          ) : showCheck ? (
            <Check className="size-3" />
          ) : (
            <Send className="size-3" />
          )}
          {showCheck ? t.webhook.sent : t.webhook.send}
        </Button>
      </div>

      {result && (
        <div
          className={`flex items-center gap-1.5 rounded px-2 py-1 text-xs ${
            result.success
              ? "bg-green-900/30 text-green-400"
              : "bg-red-900/30 text-red-400"
          }`}
        >
          {result.success ? (
            <CheckCircle2 className="size-3" />
          ) : (
            <AlertCircle className="size-3" />
          )}
          {result.success ? t.webhook.sent : result.error}
        </div>
      )}

      <Collapsible open={optionsOpen} onOpenChange={setOptionsOpen}>
        <CollapsibleTrigger className="flex items-center gap-1 text-[10px] text-[#52525b] hover:text-[#a1a1aa] transition-colors">
          <ChevronDown
            className={`size-3 transition-transform duration-200 ${optionsOpen ? "rotate-0" : "-rotate-90"}`}
          />
          {t.webhook.options}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-1.5 space-y-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            <div className="space-y-0.5">
              <label className="text-[10px] font-medium text-[#52525b]">{t.webhook.username}</label>
              <Input
                placeholder="embed.cat"
                value={webhook.username || ""}
                onChange={(e) => setWebhook({ username: e.target.value })}
                maxLength={LIMITS.WEBHOOK_USERNAME}
                className="h-7 border-white/[0.06] bg-[#0a0a0b] text-xs text-[#fafafa] placeholder:text-[#52525b]"
              />
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] font-medium text-[#52525b]">{t.webhook.avatarUrl}</label>
              <Input
                placeholder="https://..."
                value={webhook.avatar_url || ""}
                onChange={(e) => setWebhook({ avatar_url: e.target.value })}
                className="h-7 border-white/[0.06] bg-[#0a0a0b] text-xs text-[#fafafa] placeholder:text-[#52525b]"
              />
            </div>
          </div>
          <div className="space-y-0.5">
            <label className="text-[10px] font-medium text-[#52525b]">{t.webhook.threadId}</label>
            <Input
              placeholder={t.webhook.threadPlaceholder}
              value={webhook.thread_id || ""}
              onChange={(e) => setWebhook({ thread_id: e.target.value })}
              className="h-7 border-white/[0.06] bg-[#0a0a0b] text-xs text-[#fafafa] placeholder:text-[#52525b]"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
