"use client";

import { SessionProvider } from "next-auth/react";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { ToastProvider } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LocaleProvider>
        <ToastProvider>{children}</ToastProvider>
      </LocaleProvider>
    </SessionProvider>
  );
}
