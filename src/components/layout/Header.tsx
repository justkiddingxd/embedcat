"use client";

import { useState, useRef, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Cat, ChevronDown, User, Settings, Bookmark } from "lucide-react";

function ProfileDropdown({ onClose, onOpenSaved }: { onClose: () => void; onOpenSaved: () => void }) {
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
          onClick={onClose}
        >
          <User className="size-3.5" />
          Profile
        </button>
        <button
          className="flex w-full items-center gap-2.5 px-3 py-2 text-[11px] text-[#a1a1aa] hover:bg-white/[0.04] hover:text-white transition-colors"
          onClick={() => { onOpenSaved(); onClose(); }}
        >
          <Bookmark className="size-3.5" />
          Saved Embeds
        </button>
        <button
          className="flex w-full items-center gap-2.5 px-3 py-2 text-[11px] text-[#a1a1aa] hover:bg-white/[0.04] hover:text-white transition-colors"
          onClick={onClose}
        >
          <Settings className="size-3.5" />
          Settings
        </button>
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

  return (
    <header className="relative flex h-10 items-center justify-between border-b border-white/[0.06] bg-[#0a0a0b] px-4">
      <div className="w-32" />

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
            <span className="text-[11px] font-bold text-[#e4e4e7]">{session.user.name}</span>
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
        {dropdownOpen && <ProfileDropdown onClose={() => setDropdownOpen(false)} onOpenSaved={() => onOpenSaved?.()} />}
      </div>
    </header>
  );
}
