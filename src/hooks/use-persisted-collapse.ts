import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "embedcat-collapsed";

type CollapseMap = Record<string, boolean>;

let cache: CollapseMap | null = null;
const listeners = new Set<() => void>();

function getMap(): CollapseMap {
  if (cache) return cache;
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as CollapseMap) : {};
  } catch {
    cache = {};
  }
  return cache!;
}

function setMap(next: CollapseMap) {
  cache = next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

function getSnapshot() {
  return getMap();
}

function getServerSnapshot(): CollapseMap {
  return {};
}

export function usePersistedCollapse(key: string, defaultCollapsed = true): [boolean, () => void] {
  const map = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const collapsed = key in map ? map[key] : defaultCollapsed;

  const toggle = useCallback(() => {
    const current = getMap();
    const currentVal = key in current ? current[key] : defaultCollapsed;
    setMap({ ...current, [key]: !currentVal });
  }, [key, defaultCollapsed]);

  return [collapsed, toggle];
}
