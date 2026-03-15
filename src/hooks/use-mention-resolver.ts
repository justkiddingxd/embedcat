"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

interface UserData {
  id: string;
  username: string;
  display_name: string;
  avatar: string | null;
}

interface RoleData {
  id: string;
  name: string;
  color: number;
}

interface ResolveResponse {
  users: Record<string, UserData>;
  roles: Record<string, RoleData>;
}

const userCache = new Map<string, UserData>();
const roleCache = new Map<string, RoleData>();
const pendingUsers = new Set<string>();
const pendingRoles = new Set<string>();
let batchTimer: ReturnType<typeof setTimeout> | null = null;
let currentWebhookUrl = "";
let currentGuildId = "";
let revision = 0;
const listeners = new Set<() => void>();

function notify() {
  revision++;
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

function getRevision() {
  return revision;
}

async function flush() {
  batchTimer = null;
  const userIds = [...pendingUsers];
  const roleIds = [...pendingRoles];
  pendingUsers.clear();
  pendingRoles.clear();

  if (userIds.length === 0 && roleIds.length === 0) return;

  try {
    const body: Record<string, unknown> = {};
    if (userIds.length > 0) body.userIds = userIds;
    if (roleIds.length > 0) {
      body.roleIds = roleIds;
      if (currentGuildId) body.guildId = currentGuildId;
      else body.webhookUrl = currentWebhookUrl;
    }

    const res = await fetch("/api/discord/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) return;

    const data = (await res.json()) as ResolveResponse;

    for (const [id, user] of Object.entries(data.users)) {
      userCache.set(id, user);
    }
    for (const [id, role] of Object.entries(data.roles)) {
      roleCache.set(id, role);
    }

    notify();
  } catch {
    void 0;
  }
}

function scheduleBatch() {
  if (batchTimer) return;
  batchTimer = setTimeout(flush, 50);
}

function requestUser(id: string) {
  if (userCache.has(id) || pendingUsers.has(id)) return;
  pendingUsers.add(id);
  scheduleBatch();
}

function requestRole(id: string) {
  if (roleCache.has(id) || pendingRoles.has(id)) return;
  pendingRoles.add(id);
  scheduleBatch();
}

export function useMentionResolver(webhookUrl: string, guildId?: string) {
  currentWebhookUrl = webhookUrl;
  currentGuildId = guildId || "";

  useSyncExternalStore(subscribe, getRevision, getRevision);

  const resolveUser = useCallback((id: string): UserData | null => {
    const cached = userCache.get(id);
    if (cached) return cached;
    requestUser(id);
    return null;
  }, []);

  const resolveRole = useCallback((id: string): RoleData | null => {
    const cached = roleCache.get(id);
    if (cached) return cached;
    requestRole(id);
    return null;
  }, []);

  const ref = useRef({ resolveUser, resolveRole });
  ref.current = { resolveUser, resolveRole };

  useEffect(() => {
    return () => {
      if (batchTimer) {
        clearTimeout(batchTimer);
        batchTimer = null;
      }
    };
  }, []);

  return ref.current;
}
