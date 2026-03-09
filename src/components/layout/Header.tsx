"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Cat } from "lucide-react";

export function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="relative flex h-10 items-center justify-between border-b border-white/[0.06] bg-[#0a0a0b] px-4">
      <div className="w-32" />

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5">
        <Cat className="size-4 text-[#5865f2]" />
        <span className="text-xs font-bold tracking-tight text-white">
          embed.cat
        </span>
      </div>

      <div className="flex items-center gap-2">
        {status === "authenticated" && session?.user ? (
          <div className="flex items-center gap-2">
            {session.user.image && (
              <img
                src={session.user.image}
                alt=""
                className="size-5 rounded-full ring-1 ring-white/[0.06]"
              />
            )}
            <span className="text-[11px] text-[#a1a1aa]">{session.user.name}</span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => signOut()}
              className="text-[#71717a] hover:text-white transition-colors"
            >
              <LogOut className="size-3" />
            </Button>
          </div>
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
      </div>
    </header>
  );
}
