"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bot, Loader2, Check, ChevronDown, Hash, Megaphone, X } from "lucide-react";
import { signIn } from "next-auth/react";

interface Guild {
  id: string;
  name: string;
  icon: string | null;
}

interface Channel {
  id: string;
  name: string;
  category: string | null;
  type: number;
}

interface BotSendPanelProps {
  channelId: string;
  guildId: string;
  onChannelChange: (id: string) => void;
  onGuildChange: (id: string) => void;
  onSend: () => void;
  sending: boolean;
  showCheck: boolean;
  canSend: boolean;
  sendLabel: string;
  sentLabel: string;
}

export function BotSendPanel({
  channelId,
  guildId,
  onChannelChange,
  onGuildChange,
  onSend,
  sending,
  showCheck,
  canSend,
  sendLabel,
  sentLabel,
}: BotSendPanelProps) {
  const { t } = useLocale();
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [guildsLoading, setGuildsLoading] = useState(false);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [guildsLoaded, setGuildsLoaded] = useState(false);
  const [needsReauth, setNeedsReauth] = useState(false);

  useEffect(() => {
    if (guildsLoaded) return;
    setGuildsLoading(true);
    const fetchGuilds = (retries = 2): Promise<Guild[]> =>
      fetch("/api/discord/guilds").then(async (r) => {
        if (r.status === 401) {
          setNeedsReauth(true);
          return [];
        }
        if (r.status === 429 && retries > 0) {
          await new Promise((ok) => setTimeout(ok, 2000));
          return fetchGuilds(retries - 1);
        }
        return r.ok ? r.json() : [];
      });
    fetchGuilds()
      .then((data: Guild[]) => {
        setGuilds(data);
        setGuildsLoaded(true);
      })
      .catch(() => setGuilds([]))
      .finally(() => setGuildsLoading(false));
  }, [guildsLoaded]);

  useEffect(() => {
    if (!guildId) {
      setChannels([]);
      return;
    }
    setChannelsLoading(true);
    fetch(`/api/discord/channels?guildId=${guildId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Channel[]) => setChannels(data))
      .catch(() => setChannels([]))
      .finally(() => setChannelsLoading(false));
  }, [guildId]);

  const selectedGuild = guilds.find((g) => g.id === guildId);
  const selectedChannel = channels.find((c) => c.id === channelId);

  const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID}&permissions=2416307200&scope=bot`;

  // Not authenticated or token expired — show sign in
  if (needsReauth) {
    return (
      <div className="space-y-2">
        <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-5 text-center">
          <Bot className="size-6 text-[#5865f2]" />
          <div className="space-y-1">
            <p className="text-[13px] text-[#e4e4e7] font-medium">
              {t.webhook.signInRequired ?? "Sign in to use Bot mode"}
            </p>
            <p className="text-[11px] text-[#52525b]">
              {t.webhook.signInHint ?? "Sign in with Discord to select a server and channel."}
            </p>
          </div>
          <button
            onClick={() => signIn("discord")}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-[#5865f2] text-white text-[13px] font-medium hover:bg-[#4752c4] transition-colors"
          >
            {t.webhook.signIn ?? "Sign in with Discord"}
          </button>
        </div>
      </div>
    );
  }

  // No servers with bot — show invite prompt
  if (guildsLoaded && guilds.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-5 text-center">
          <Bot className="size-6 text-[#5865f2]" />
          <div className="space-y-1">
            <p className="text-[13px] text-[#e4e4e7] font-medium">
              {t.webhook.noBotServers ?? "Bot not added to any server"}
            </p>
            <p className="text-[11px] text-[#52525b]">
              {t.webhook.addBotHint ?? "Add the bot to a server where you're an admin to send messages via bot."}
            </p>
          </div>
          <a
            href={inviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-[#5865f2] text-white text-[13px] font-medium hover:bg-[#4752c4] transition-colors"
          >
            <Bot className="size-3.5" />
            {t.webhook.addBotToServer ?? "Add Bot to Server"}
          </a>
        </div>
        <SendButton
          onClick={onSend}
          disabled={true}
          sending={sending}
          showCheck={showCheck}
          sendLabel={sendLabel}
          sentLabel={sentLabel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {guildsLoading ? (
        <div className="h-8 flex items-center justify-center text-[11px] text-[#52525b]">
          <Loader2 className="size-3 animate-spin mr-1.5" />
          Loading servers...
        </div>
      ) : (
        <Combobox
          value={guildId}
          onChange={(v) => {
            onGuildChange(v);
            onChannelChange("");
          }}
          placeholder={t.webhook.selectServer ?? "Select server..."}
          searchPlaceholder="Search servers..."
          items={guilds.map((g) => ({
            id: g.id,
            label: g.name,
            icon: g.icon ? (
              <img src={g.icon} alt="" className="size-5 rounded-full shrink-0" />
            ) : (
              <div className="size-5 rounded-full bg-[#5865f2]/20 flex items-center justify-center shrink-0">
                <span className="text-[10px] text-[#8b9fef] font-medium">
                  {g.name.charAt(0).toUpperCase()}
                </span>
              </div>
            ),
          }))}
          selected={
            selectedGuild
              ? {
                  label: selectedGuild.name,
                  icon: selectedGuild.icon ? (
                    <img src={selectedGuild.icon} alt="" className="size-5 rounded-full shrink-0" />
                  ) : (
                    <div className="size-5 rounded-full bg-[#5865f2]/20 flex items-center justify-center shrink-0">
                      <span className="text-[10px] text-[#8b9fef] font-medium">
                        {selectedGuild.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  ),
                }
              : null
          }
        />
      )}

      <a
        href={inviteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1 py-1 rounded text-[10px] text-[#5865f2] hover:text-[#8b9fef] transition-colors"
      >
        <Bot className="size-3" />
        {t.webhook.addBot ?? "Add Bot"}
      </a>

      {guildId && (
        channelsLoading ? (
          <div className="h-8 flex items-center justify-center text-[11px] text-[#52525b]">
            <Loader2 className="size-3 animate-spin mr-1.5" />
            Loading channels...
          </div>
        ) : (
          <Combobox
            value={channelId}
            onChange={onChannelChange}
            placeholder={t.webhook.selectChannel ?? "Select channel..."}
            searchPlaceholder="Search channels..."
            groups={buildChannelGroups(channels)}
            selected={
              selectedChannel
                ? {
                    label: selectedChannel.name,
                    icon: <ChannelIcon type={selectedChannel.type} />,
                  }
                : null
            }
          />
        )
      )}

      {!guildId && !guildsLoading && (
        <div className="h-8 flex items-center justify-center text-[11px] text-[#3f3f46]">
          {t.webhook.selectServerFirst ?? "Select a server first"}
        </div>
      )}

      <SendButton
        onClick={onSend}
        disabled={sending || !canSend}
        sending={sending}
        showCheck={showCheck}
        sendLabel={sendLabel}
        sentLabel={sentLabel}
      />
    </div>
  );
}

// --- Combobox ---

interface ComboboxItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface ComboboxGroup {
  label: string;
  items: ComboboxItem[];
}

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  items?: ComboboxItem[];
  groups?: ComboboxGroup[];
  selected: { label: string; icon?: React.ReactNode } | null;
}

function Combobox({ value, onChange, placeholder, searchPlaceholder, items, groups, selected }: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const allItems = useMemo(() => {
    if (items) return items;
    if (groups) return groups.flatMap((g) => g.items);
    return [];
  }, [items, groups]);

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return items ?? [];
    return allItems.filter((i) => i.label.toLowerCase().includes(q));
  }, [search, items, allItems]);

  const filteredGroups = useMemo(() => {
    if (!groups) return [];
    const q = search.toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((i) => i.label.toLowerCase().includes(q)),
      }))
      .filter((g) => g.items.length > 0);
  }, [search, groups]);

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
    setSearch("");
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-8 px-2.5 rounded-md border border-white/[0.06] bg-[#0a0a0b] flex items-center gap-2 hover:border-white/[0.12] transition-colors group"
      >
        {selected ? (
          <>
            {selected.icon}
            <span className="text-[13px] text-[#fafafa] truncate flex-1 text-left">{selected.label}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
                setOpen(false);
              }}
              className="p-0.5 rounded text-[#52525b] hover:text-[#a1a1aa] hover:bg-white/[0.06] transition-colors"
            >
              <X className="size-3" />
            </button>
          </>
        ) : (
          <>
            <span className="text-[13px] text-[#3f3f46] truncate flex-1 text-left">{placeholder}</span>
            <ChevronDown className="size-3.5 text-[#52525b] group-hover:text-[#a1a1aa] transition-colors shrink-0" />
          </>
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-white/[0.08] bg-[#111113] shadow-xl shadow-black/40 overflow-hidden">
          <div className="p-1.5 border-b border-white/[0.06]">
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full h-7 px-2 rounded bg-[#0a0a0b] border border-white/[0.06] text-[12px] text-[#fafafa] placeholder:text-[#3f3f46] outline-none focus:border-[#5865f2]/50 transition-colors"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {items && filteredItems.length === 0 && (
              <div className="px-3 py-3 text-[11px] text-[#52525b] text-center">Nothing found</div>
            )}
            {items &&
              filteredItems.map((item) => (
                <ComboboxOption
                  key={item.id}
                  item={item}
                  active={item.id === value}
                  onSelect={() => handleSelect(item.id)}
                />
              ))}
            {groups &&
              filteredGroups.map((group) => (
                <div key={group.label}>
                  {group.label && (
                    <div className="px-3 pt-2.5 pb-1 text-[10px] font-semibold text-[#52525b] uppercase tracking-wider">
                      {group.label}
                    </div>
                  )}
                  {group.items.map((item) => (
                    <ComboboxOption
                      key={item.id}
                      item={item}
                      active={item.id === value}
                      onSelect={() => handleSelect(item.id)}
                    />
                  ))}
                </div>
              ))}
            {groups && filteredGroups.length === 0 && (
              <div className="px-3 py-3 text-[11px] text-[#52525b] text-center">Nothing found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ComboboxOption({
  item,
  active,
  onSelect,
}: {
  item: ComboboxItem;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full px-3 py-1.5 flex items-center gap-2 text-left transition-colors ${
        active
          ? "bg-[#5865f2]/15 text-[#fafafa]"
          : "text-[#d4d4d8] hover:bg-white/[0.04] hover:text-[#fafafa]"
      }`}
    >
      {item.icon}
      <span className="text-[13px] truncate">{item.label}</span>
      {active && <Check className="size-3 text-[#5865f2] ml-auto shrink-0" />}
    </button>
  );
}

// --- Helpers ---

function buildChannelGroups(channels: Channel[]): ComboboxGroup[] {
  const groups = new Map<string, ComboboxItem[]>();

  for (const ch of channels) {
    const cat = ch.category ?? "";
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push({
      id: ch.id,
      label: ch.name,
      icon: <ChannelIcon type={ch.type} />,
    });
  }

  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

function ChannelIcon({ type }: { type: number }) {
  if (type === 5) return <Megaphone className="size-3.5 text-[#52525b] shrink-0" />;
  return <Hash className="size-3.5 text-[#52525b] shrink-0" />;
}

function SendButton({
  onClick,
  disabled,
  sending,
  showCheck,
  sendLabel,
  sentLabel,
}: {
  onClick: () => void;
  disabled: boolean;
  sending: boolean;
  showCheck: boolean;
  sendLabel: string;
  sentLabel: string;
}) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      size="sm"
      className={`w-full h-8 gap-1.5 text-[13px] font-medium text-white disabled:opacity-50 transition-colors ${
        showCheck
          ? "bg-emerald-600 hover:bg-emerald-600"
          : "bg-[#5865f2] hover:bg-[#4752c4]"
      }`}
    >
      {sending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : showCheck ? (
        <Check className="size-3.5" />
      ) : (
        <Bot className="size-3.5" />
      )}
      {showCheck ? sentLabel : sendLabel}
    </Button>
  );
}
