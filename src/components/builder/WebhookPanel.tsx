"use client";

import { useState } from "react";
import { useBuilderStore } from "@/store/builder-store";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  buildClassicPayload,
  buildComponentsV2Payload,
  sendWebhookMessage,
  sendBotMessage,
  hasNonLinkButtons,
} from "@/lib/build-payload";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Send, ChevronDown, Loader2, AlertCircle, Check, Bot } from "lucide-react";
import { LIMITS } from "@/types/discord";
import { useToast } from "@/components/ui/toast";
import { BotSendPanel } from "./BotSendPanel";

export function WebhookPanel() {
  const webhook = useBuilderStore((s) => s.webhook);
  const setWebhook = useBuilderStore((s) => s.setWebhook);
  const mode = useBuilderStore((s) => s.mode);
  const content = useBuilderStore((s) => s.content);
  const embeds = useBuilderStore((s) => s.embeds);
  const components = useBuilderStore((s) => s.components);
  const buttonActions = useBuilderStore((s) => s.buttonActions);
  const { t } = useLocale();
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [showCheck, setShowCheck] = useState(false);

  const botChannelId = useBuilderStore((s) => s.botChannelId);
  const setBotChannelId = useBuilderStore((s) => s.setBotChannelId);
  const [botGuildId, setBotGuildIdLocal] = useState("");
  const storeBotGuildId = useBuilderStore((s) => s.setBotGuildId);
  const setBotGuildId = (id: string) => {
    setBotGuildIdLocal(id);
    storeBotGuildId(id);
  };

  const needsBot = mode === "components_v2" && hasNonLinkButtons(components);
  const [forceBotMode, setForceBotMode] = useState(false);
  const useBotMode = needsBot || forceBotMode;

  const handleSend = async () => {
    setSending(true);
    setResult(null);
    setShowCheck(false);

    let res: { success: boolean; error?: string };

    if (useBotMode) {
      if (!botChannelId) {
        setResult({ success: false, error: "Channel ID is required" });
        setSending(false);
        return;
      }

      const payload =
        mode === "classic"
          ? buildClassicPayload(content, embeds, webhook)
          : buildComponentsV2Payload(components, webhook);

      res = await sendBotMessage(
        botChannelId,
        botGuildId,
        payload,
        components,
        buttonActions,
      );
    } else {
      if (!webhook.url) {
        setSending(false);
        return;
      }

      const payload =
        mode === "classic"
          ? buildClassicPayload(content, embeds, webhook)
          : buildComponentsV2Payload(components, webhook);

      res = await sendWebhookMessage(webhook, payload);
    }

    setResult(res);
    setSending(false);

    if (res.success) {
      setShowCheck(true);
      toast(t.toast.embedSent);
      setTimeout(() => {
        setShowCheck(false);
        setResult(null);
      }, 2000);
    } else {
      toast(res.error || t.toast.sendError, "error");
    }
  };

  const isValidUrl = /^https:\/\/(canary\.|ptb\.)?discord\.com\/api\/webhooks\/\d+\/.+$/.test(
    webhook.url,
  );
  const canSend = useBotMode ? !!botChannelId : isValidUrl;

  return (
    <div className="space-y-1.5 rounded-md border border-white/[0.06] bg-[#111113] p-2">
      {needsBot && !forceBotMode && (
        <div className="flex items-center gap-1.5 rounded px-2 py-1 text-[11px] bg-[#5865f2]/10 text-[#8b9fef]">
          <Bot className="size-3 shrink-0" />
          <span className="flex-1">{t.actions.botSendHint}</span>
          <a
            href={`https://discord.com/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID}&permissions=2416307200&scope=bot`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-2 py-0.5 rounded bg-[#5865f2] text-white text-[10px] font-medium hover:bg-[#4752c4] transition-colors"
          >
            {t.webhook.addBot ?? "Add Bot"}
          </a>
        </div>
      )}

      {!needsBot && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setForceBotMode(false)}
            className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
              !useBotMode
                ? "bg-white/[0.08] text-[#e4e4e7]"
                : "text-[#52525b] hover:text-[#a1a1aa]"
            }`}
          >
            {t.webhook.webhookMode}
          </button>
          <button
            onClick={() => setForceBotMode(true)}
            className={`text-[10px] px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
              useBotMode
                ? "bg-[#5865f2]/20 text-[#8b9fef]"
                : "text-[#52525b] hover:text-[#a1a1aa]"
            }`}
          >
            <Bot className="size-2.5" />
            {t.webhook.botMode}
          </button>
          {useBotMode && (
            <a
              href={`https://discord.com/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID}&permissions=2416307200&scope=bot`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto shrink-0 px-2 py-0.5 rounded bg-[#5865f2] text-white text-[10px] font-medium hover:bg-[#4752c4] transition-colors"
            >
              {t.webhook.addBot ?? "Add Bot"}
            </a>
          )}
        </div>
      )}

      {useBotMode ? (
        <BotSendPanel
          channelId={botChannelId}
          guildId={botGuildId}
          onChannelChange={setBotChannelId}
          onGuildChange={setBotGuildId}
          onSend={handleSend}
          sending={sending}
          showCheck={showCheck}
          canSend={canSend}
          sendLabel={t.webhook.sendViaBot}
          sentLabel={t.webhook.sent}
        />
      ) : (
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
            className={`h-7 gap-1.5 px-3 text-xs text-white disabled:opacity-50 transition-colors ${
              showCheck
                ? "bg-emerald-600 hover:bg-emerald-600"
                : "bg-[#5865f2] hover:bg-[#4752c4]"
            }`}
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
      )}

      {result && !result.success && (
        <div className="flex items-center gap-1.5 rounded px-2 py-1 text-xs bg-red-900/30 text-red-400">
          <AlertCircle className="size-3" />
          {result.error}
        </div>
      )}

      {!useBotMode && (
        <Collapsible open={optionsOpen} onOpenChange={setOptionsOpen}>
          <CollapsibleTrigger className="flex items-center gap-1 text-[10px] text-[#52525b] hover:text-[#a1a1aa] transition-colors">
            <ChevronDown
              className={`size-3 transition-transform duration-200 ${
                optionsOpen ? "rotate-0" : "-rotate-90"
              }`}
            />
            {t.webhook.options}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1.5 space-y-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <div className="space-y-0.5">
                <label className="text-[10px] font-medium text-[#52525b]">
                  {t.webhook.username}
                </label>
                <Input
                  placeholder="embed.cat"
                  value={webhook.username || ""}
                  onChange={(e) => setWebhook({ username: e.target.value })}
                  maxLength={LIMITS.WEBHOOK_USERNAME}
                  className="h-7 border-white/[0.06] bg-[#0a0a0b] text-xs text-[#fafafa] placeholder:text-[#52525b]"
                />
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px] font-medium text-[#52525b]">
                  {t.webhook.avatarUrl}
                </label>
                <Input
                  placeholder="https://..."
                  value={webhook.avatar_url || ""}
                  onChange={(e) => setWebhook({ avatar_url: e.target.value })}
                  className="h-7 border-white/[0.06] bg-[#0a0a0b] text-xs text-[#fafafa] placeholder:text-[#52525b]"
                />
              </div>
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] font-medium text-[#52525b]">
                {t.webhook.threadId}
              </label>
              <Input
                placeholder={t.webhook.threadPlaceholder}
                value={webhook.thread_id || ""}
                onChange={(e) => setWebhook({ thread_id: e.target.value })}
                className="h-7 border-white/[0.06] bg-[#0a0a0b] text-xs text-[#fafafa] placeholder:text-[#52525b]"
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
