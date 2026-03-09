"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Cat, ChevronDown, Bookmark, Shield, X, Infinity, Clock } from "lucide-react";

const ADMIN_USER_ID = "1376745003174334505";

interface UnlimitedUserRow {
  discordId: string;
  addedBy: string;
  createdAt: string;
}

function AdminPanel({ onClose }: { onClose: () => void }) {
  const [users, setUsers] = useState<UnlimitedUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newId, setNewId] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) setUsers(await res.json() as UnlimitedUserRow[]);
    } catch { void 0; }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

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
      fetchUsers();
    }
  };

  const handleAdd = async () => {
    const id = newId.trim();
    if (!id || !/^\d{17,20}$/.test(id)) return;
    await toggleUser(id);
    setNewId("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div ref={ref} className="w-full max-w-md max-h-[80vh] rounded-lg border border-white/[0.08] bg-[#111113] shadow-2xl shadow-black/60 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-[#5865f2]" />
            <h2 className="text-sm font-semibold text-[#e4e4e7]">Configure Users</h2>
          </div>
          <button onClick={onClose} className="text-[#71717a] hover:text-white transition-colors text-lg leading-none">&times;</button>
        </div>

        <div className="px-4 py-3 border-b border-white/[0.06]">
          <div className="flex gap-2">
            <input
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              placeholder="Discord User ID"
              className="flex-1 h-8 rounded-md bg-[#0a0a0b] border border-white/[0.06] px-3 text-xs text-[#e4e4e7] placeholder:text-[#3f3f46] outline-none focus:border-[#5865f2]/40"
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            />
            <button
              onClick={handleAdd}
              className="h-8 px-3 rounded-md bg-[#5865f2] text-white text-xs font-medium hover:bg-[#4752c4] transition-colors"
            >
              Add
            </button>
          </div>
          {actionMsg && (
            <p className="text-[10px] text-emerald-400 mt-1.5">{actionMsg}</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {loading ? (
            <p className="text-sm text-[#71717a] text-center py-8">Loading...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-[#71717a] text-center py-8">No unlimited users</p>
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
                  title="Remove unlimited"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileDropdown({ onClose, onOpenSaved, onOpenAdmin, isAdmin }: { onClose: () => void; onOpenSaved: () => void; onOpenAdmin: () => void; isAdmin: boolean }) {
  const { data: session } = useSession();
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
          Saved Embeds
        </button>
        {isAdmin && (
          <button
            className="flex w-full items-center gap-2.5 px-3 py-2 text-[11px] text-[#a1a1aa] hover:bg-white/[0.04] hover:text-white transition-colors"
            onClick={() => { onOpenAdmin(); onClose(); }}
          >
            <Shield className="size-3.5" />
            Configure Users
          </button>
        )}
      </div>
      <div className="border-t border-white/[0.06] py-1">
        <button
          className="flex w-full items-center gap-2.5 px-3 py-2 text-[11px] text-red-400 hover:bg-red-500/10 transition-colors"
          onClick={() => { signOut(); onClose(); }}
        >
          <LogOut className="size-3.5" />
          Sign out
        </button>
      </div>
    </div>
  );
}

export function Header({ onOpenSaved }: { onOpenSaved?: () => void }) {
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  const userId = (session?.user as { id?: string } | undefined)?.id;
  const isAdmin = userId === ADMIN_USER_ID;

  return (
    <>
    <header className="relative flex h-10 items-center justify-between border-b border-white/[0.06] bg-[#0a0a0b] px-4">
      <div className="w-8 sm:w-32" />

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
            Sign in
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
