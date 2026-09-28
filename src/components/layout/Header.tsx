"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useLocale } from "@/lib/i18n/locale-context";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Cat, ChevronDown, Bookmark, Shield, X, Infinity, Users, BarChart3, FileText, Globe, Search, ArrowLeft, Bot, Send, MessageSquare, Save } from "lucide-react";
import Link from "next/link";

const ADMIN_USER_ID = "1376745003174334505";

interface UnlimitedUserRow {
  discordId: string;
  addedBy: string;
  createdAt: string;
}

interface AppUserRow {
  discordId: string;
  username: string;
  displayName: string;
  avatar: string | null;
  firstLogin: string;
  lastLogin: string;
}

interface AdminStats {
  totalUsers: number;
  todayUsers: number;
  weekUsers: number;
  totalSessions: number;
  totalMessages: number;
  totalSavedEmbeds: number;
  unlimitedCount: number;
  recentUsers: AppUserRow[];
  discordAppStats: { userInstalls: number | null; guildCount: number | null } | null;
}

interface UserStatsData {
  discordId: string;
  username: string;
  displayName: string;
  avatar: string | null;
  firstLogin: string;
  lastLogin: string;
  lastActive: string;
  aiRequests: number;
  embedsCreated: number;
  webhooksSent: number;
  chatSessions: number;
  savedEmbeds: number;
  isUnlimited: boolean;
}

function LangSwitcher() {
  const { locale, setLocale } = useLocale();
  return (
    <button
      onClick={() => setLocale(locale === "en" ? "ru" : "en")}
      className="inline-flex items-center gap-1 text-[11px] font-medium text-[#52525b] hover:text-[#a1a1aa] transition-colors"
    >
      <Globe className="size-3" />
      {locale === "en" ? "RU" : "EN"}
    </button>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-md bg-white/[0.03] border border-white/[0.06] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-[#52525b] font-medium">{label}</p>
      <p className="text-lg font-bold text-[#e4e4e7] tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-[#52525b]">{sub}</p>}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function UserStatsModal({ data, onClose }: { data: UserStatsData; onClose: () => void }) {
  const { t } = useLocale();
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60"
      onMouseDown={(e) => { e.nativeEvent.stopImmediatePropagation(); if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm rounded-lg border border-white/[0.08] bg-[#111113] shadow-2xl shadow-black/60 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <button onClick={onClose} className="text-[#52525b] hover:text-white transition-colors">
              <ArrowLeft className="size-3.5" />
            </button>
            {data.avatar ? (
              <img src={data.avatar} alt="" className="size-7 rounded-full" />
            ) : (
              <div className="size-7 rounded-full bg-[#5865f2]/20 flex items-center justify-center">
                <Users className="size-3.5 text-[#5865f2]" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#e4e4e7] truncate">{data.displayName || data.username}</p>
              <p className="text-[10px] text-[#52525b] font-mono">{data.discordId}</p>
            </div>
          </div>
          {data.isUnlimited && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-[#5865f2] bg-[#5865f2]/10 px-2 py-0.5 rounded-full">
              <Infinity className="size-3" />
              {t.admin.unlimitedStatus}
            </span>
          )}
        </div>
        <div className="p-3 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <StatCard label={t.admin.aiRequests} value={data.aiRequests} />
            <StatCard label={t.admin.embedsCreated} value={data.embedsCreated} />
            <StatCard label={t.admin.webhooksSent} value={data.webhooksSent} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <StatCard label={t.admin.chatSessionsCount} value={data.chatSessions} />
            <StatCard label={t.admin.savedEmbedsUser} value={data.savedEmbeds} />
          </div>
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] text-[#52525b]">{t.admin.firstSeen}</span>
              <span className="text-[10px] text-[#a1a1aa] tabular-nums">{formatDate(data.firstLogin)}</span>
            </div>
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] text-[#52525b]">{t.admin.lastLoginLabel}</span>
              <span className="text-[10px] text-[#a1a1aa] tabular-nums">{formatDate(data.lastLogin)}</span>
            </div>
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] text-[#52525b]">{t.admin.lastActiveLabel}</span>
              <span className="text-[10px] text-[#a1a1aa] tabular-nums">{formatDate(data.lastActive)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminPanel({ onClose }: { onClose: () => void }) {
  const { t } = useLocale();
  const [tab, setTab] = useState<"stats" | "unlimited">("stats");
  const [users, setUsers] = useState<UnlimitedUserRow[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [newId, setNewId] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [searchId, setSearchId] = useState("");
  const [searchError, setSearchError] = useState("");
  const [userStats, setUserStats] = useState<UserStatsData | null>(null);
  const [userStatsLoading, setUserStatsLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const userStatsRef = useRef<UserStatsData | null>(null);
  userStatsRef.current = userStats;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userStatsRef.current) return;
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/stats"),
      ]);
      if (usersRes.ok) setUsers(await usersRes.json() as UnlimitedUserRow[]);
      if (statsRes.ok) setStats(await statsRes.json() as AdminStats);
    } catch { void 0; }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleUser = async (discordId: string) => {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discordId }),
    });
    if (res.ok) {
      const data = await res.json() as { action: string; discordId: string };
      setActionMsg(`${data.discordId}: ${data.action}`);
      setTimeout(() => setActionMsg(""), 2000);
      fetchData();
    }
  };

  const handleAdd = async () => {
    const id = newId.trim();
    if (!id || !/^\d{17,20}$/.test(id)) return;
    await toggleUser(id);
    setNewId("");
  };

  const fetchUserStats = async (discordId: string) => {
    setUserStatsLoading(true);
    setSearchError("");
    try {
      const res = await fetch(`/api/admin/users/${discordId}/stats`);
      if (!res.ok) {
        setSearchError(t.admin.userNotFound);
        setUserStatsLoading(false);
        return;
      }
      setUserStats(await res.json() as UserStatsData);
    } catch {
      setSearchError(t.admin.userNotFound);
    }
    setUserStatsLoading(false);
  };

  const handleSearch = () => {
    const id = searchId.trim();
    if (!id || !/^\d{17,20}$/.test(id)) return;
    fetchUserStats(id);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div ref={ref} className="w-full max-w-lg max-h-[85vh] rounded-lg border border-white/[0.08] bg-[#111113] shadow-2xl shadow-black/60 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-[#5865f2]" />
            <h2 className="text-sm font-semibold text-[#e4e4e7]">{t.admin.adminPanel}</h2>
          </div>
          <button onClick={onClose} className="text-[#71717a] hover:text-white transition-colors text-lg leading-none">&times;</button>
        </div>

        <div className="flex border-b border-white/[0.06]">
          <button
            onClick={() => setTab("stats")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-semibold transition-colors ${tab === "stats" ? "text-[#5865f2] border-b-2 border-[#5865f2]" : "text-[#52525b] hover:text-[#a1a1aa]"}`}
          >
            <BarChart3 className="size-3" />
            {t.admin.stats}
          </button>
          <button
            onClick={() => setTab("unlimited")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-semibold transition-colors ${tab === "unlimited" ? "text-[#5865f2] border-b-2 border-[#5865f2]" : "text-[#52525b] hover:text-[#a1a1aa]"}`}
          >
            <Infinity className="size-3" />
            {t.admin.unlimitedUsers}
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <p className="text-sm text-[#71717a]">{t.admin.loading}</p>
          </div>
        ) : tab === "stats" && stats ? (
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <StatCard label={t.admin.totalUsers} value={stats.totalUsers} />
              <StatCard label={t.admin.today} value={stats.todayUsers} />
              <StatCard label={t.admin.thisWeek} value={stats.weekUsers} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <StatCard label={t.admin.chatSessions} value={stats.totalSessions} />
              <StatCard label={t.admin.messages} value={stats.totalMessages} />
              <StatCard label={t.admin.savedEmbedsCount} value={stats.totalSavedEmbeds} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <StatCard label={t.admin.unlimited} value={stats.unlimitedCount} />
              {stats.discordAppStats && (
                <StatCard
                  label={t.admin.discordApp}
                  value={stats.discordAppStats.userInstalls ?? "—"}
                  sub={stats.discordAppStats.guildCount ? `${stats.discordAppStats.guildCount} ${t.admin.guilds}` : undefined}
                />
              )}
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#52525b] font-medium mb-2">{t.admin.userStats}</p>
              <div className="flex gap-2 mb-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-[#3f3f46]" />
                  <input
                    value={searchId}
                    onChange={(e) => { setSearchId(e.target.value); setSearchError(""); }}
                    placeholder={t.admin.searchUserPlaceholder}
                    className="w-full h-8 rounded-md bg-[#0a0a0b] border border-white/[0.06] pl-8 pr-3 text-xs text-[#e4e4e7] placeholder:text-[#3f3f46] outline-none focus:border-[#5865f2]/40"
                    onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={userStatsLoading}
                  className="h-8 px-3 rounded-md bg-[#5865f2] text-white text-xs font-medium hover:bg-[#4752c4] transition-colors disabled:opacity-50"
                >
                  {t.admin.searchUser}
                </button>
              </div>
              {searchError && <p className="text-[10px] text-red-400 mb-2">{searchError}</p>}
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#52525b] font-medium mb-2">{t.admin.recentUsers}</p>
              <div className="space-y-0.5">
                {stats.recentUsers.map((u) => (
                  <button
                    key={u.discordId}
                    onClick={() => fetchUserStats(u.discordId)}
                    className="flex w-full items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/[0.06] transition-colors cursor-pointer text-left"
                  >
                    {u.avatar ? (
                      <img src={u.avatar} alt="" className="size-6 rounded-full shrink-0" />
                    ) : (
                      <div className="size-6 rounded-full bg-[#5865f2]/20 shrink-0 flex items-center justify-center">
                        <Users className="size-3 text-[#5865f2]" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-[#e4e4e7] truncate">
                          {u.displayName || u.username}
                        </span>
                        {u.username && u.displayName && u.username !== u.displayName && (
                          <span className="text-[10px] text-[#52525b] truncate">@{u.username}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-[#52525b] shrink-0 tabular-nums">{timeAgo(u.lastLogin)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : tab === "unlimited" ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <div className="flex gap-2">
                <input
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  placeholder={t.admin.discordUserId}
                  className="flex-1 h-8 rounded-md bg-[#0a0a0b] border border-white/[0.06] px-3 text-xs text-[#e4e4e7] placeholder:text-[#3f3f46] outline-none focus:border-[#5865f2]/40"
                  onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                />
                <button
                  onClick={handleAdd}
                  className="h-8 px-3 rounded-md bg-[#5865f2] text-white text-xs font-medium hover:bg-[#4752c4] transition-colors"
                >
                  {t.admin.addUser}
                </button>
              </div>
              {actionMsg && (
                <p className="text-[10px] text-emerald-400 mt-1.5">{actionMsg}</p>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {users.length === 0 ? (
                <p className="text-sm text-[#71717a] text-center py-8">{t.admin.noUnlimited}</p>
              ) : (
                users.map((u) => (
                  <div key={u.discordId} className="flex items-center gap-2 px-2.5 py-2 rounded-md bg-white/[0.03] border border-white/[0.06]">
                    <Infinity className="size-3.5 text-[#5865f2] shrink-0" />
                    <span className="flex-1 text-xs font-mono text-[#e4e4e7] truncate">{u.discordId}</span>
                    <span className="text-[10px] text-[#52525b] shrink-0">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => toggleUser(u.discordId)}
                      className="shrink-0 w-6 h-6 rounded flex items-center justify-center text-[#71717a] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title={t.admin.removeUnlimited}
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>
      {userStats && (
        <UserStatsModal data={userStats} onClose={() => setUserStats(null)} />
      )}
    </div>
  );
}

function ProfileDropdown({ onClose, onOpenSaved, onOpenAdmin, isAdmin }: { onClose: () => void; onOpenSaved: () => void; onOpenAdmin: () => void; isAdmin: boolean }) {
  const { data: session } = useSession();
  const { t } = useLocale();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1 z-50 w-56 rounded-lg border border-white/[0.08] bg-[#111113] shadow-xl shadow-black/50 overflow-hidden"
    >
      <div className="px-3 py-2.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          {session?.user?.image && (
            <img src={session.user.image} alt="" className="size-9 rounded-full ring-2 ring-white/[0.1]" />
          )}
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#e4e4e7] truncate">{session?.user?.name}</p>
            <p className="text-[10px] text-[#52525b]">Discord</p>
          </div>
        </div>
      </div>
      <div className="py-1">
        <button
          className="flex w-full items-center gap-2.5 px-3 py-2 text-[11px] text-[#a1a1aa] hover:bg-white/[0.04] hover:text-white transition-colors"
          onClick={() => { onOpenSaved(); onClose(); }}
        >
          <Bookmark className="size-3.5" />
          {t.header.savedEmbeds}
        </button>
        {isAdmin && (
          <button
            className="flex w-full items-center gap-2.5 px-3 py-2 text-[11px] text-[#a1a1aa] hover:bg-white/[0.04] hover:text-white transition-colors"
            onClick={() => { onOpenAdmin(); onClose(); }}
          >
            <Shield className="size-3.5" />
            {t.header.configureUsers}
          </button>
        )}
      </div>
      <div className="border-t border-white/[0.06] py-1">
        <button
          className="flex w-full items-center gap-2.5 px-3 py-2 text-[11px] text-red-400 hover:bg-red-500/10 transition-colors"
          onClick={() => { signOut(); onClose(); }}
        >
          <LogOut className="size-3.5" />
          {t.header.signOut}
        </button>
      </div>
    </div>
  );
}

export function Header({ onOpenSaved }: { onOpenSaved?: () => void }) {
  const { data: session, status } = useSession();
  const { t } = useLocale();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  const userId = (session?.user as { id?: string } | undefined)?.id;
  const isAdmin = userId === ADMIN_USER_ID;

  return (
    <>
    <header className="relative flex h-10 items-center justify-between border-b border-white/[0.06] bg-[#0a0a0b] px-4">
      <div className="flex items-center gap-2.5">
        <Link
          href="/docs"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-[#52525b] hover:text-[#a1a1aa] transition-colors"
        >
          <FileText className="size-3" />
          <span className="hidden sm:inline">{t.header.docs}</span>
        </Link>
        <a
          href="https://discord.gg/HvZGEYEgt5"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-[#52525b] hover:text-[#a1a1aa] transition-colors"
        >
          <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z" /></svg>
          Community
        </a>
        <a
          href="https://github.com/justkiddingxd/embedcat"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-[#52525b] hover:text-[#a1a1aa] transition-colors"
        >
          <svg className="size-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
          <span className="hidden sm:inline">{t.header.openSource}</span>
        </a>
        <LangSwitcher />
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5">
        <Cat className="size-4 text-[#5865f2]" />
        <span className="text-xs font-bold tracking-tight text-white">
          embed.cat
        </span>
      </div>

      <div className="relative flex items-center gap-2">
        {status === "authenticated" && session?.user ? (
          <button
            onClick={() => setDropdownOpen((p) => !p)}
            className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-white/[0.04] transition-colors"
          >
            {session.user.image && (
              <img src={session.user.image} alt="" className="size-7 rounded-full ring-2 ring-white/[0.1]" />
            )}
            <span className="hidden text-[11px] font-bold text-[#e4e4e7] sm:inline">{session.user.name}</span>
            <ChevronDown className={`size-3 text-[#52525b] transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signIn("discord")}
            className="h-6 gap-1.5 text-[11px] text-[#a1a1aa] hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            <LogIn className="size-3" />
            {t.header.signIn}
          </Button>
        )}
        {dropdownOpen && (
          <ProfileDropdown
            onClose={() => setDropdownOpen(false)}
            onOpenSaved={() => onOpenSaved?.()}
            onOpenAdmin={() => setAdminOpen(true)}
            isAdmin={isAdmin}
          />
        )}
      </div>
    </header>
    {adminOpen && <AdminPanel onClose={() => setAdminOpen(false)} />}
    </>
  );
}
