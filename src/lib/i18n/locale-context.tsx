"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { en } from "./en";
import { ru } from "./ru";

export type Locale = "en" | "ru";
export type Dict = typeof en;

const dictionaries: Record<Locale, Dict> = { en, ru };

const STORAGE_KEY = "embedcat-locale";

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "ru" || stored === "en") return stored;
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith("ru")) return "ru";
  return "en";
}

interface LocaleCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Dict;
}

const LocaleContext = createContext<LocaleCtx>({
  locale: "en",
  setLocale: () => {},
  t: en,
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    setLocaleState(getInitialLocale());
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = dictionaries[locale];

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
