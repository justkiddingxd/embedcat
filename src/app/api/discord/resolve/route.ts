import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const ID_REGEX = /^\d{17,20}$/;
const WEBHOOK_REGEX = /^https:\/\/(canary\.|ptb\.)?discord\.com\/api\/webhooks\/(\d+)\/(.+)$/;

interface CacheEntry<T> {
  data: T;
  ts: number;
}

const userCache = new Map<string, CacheEntry<UserData>>();
const roleCache = new Map<string, CacheEntry<RoleData[]>>();
const CACHE_TTL = 5 * 60 * 1000;

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

async function fetchUser(id: string, token: string): Promise<UserData | null> {
  const cached = userCache.get(id);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  const res = await fetch(`https://discord.com/api/v10/users/${id}`, {
    headers: { Authorization: `Bot ${token}` },
  });
  if (!res.ok) return null;

  const user = (await res.json()) as {
    id: string;
    username: string;
    global_name: string | null;
    avatar: string | null;
  };

  const data: UserData = {
    id: user.id,
    username: user.username,
    display_name: user.global_name || user.username,
    avatar: user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp?size=64`
      : null,
  };

  userCache.set(id, { data, ts: Date.now() });
  return data;
}

async function fetchGuildRoles(
  webhookUrl: string,
  token: string
): Promise<RoleData[]> {
  const cached = roleCache.get(webhookUrl);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  const whMatch = webhookUrl.match(WEBHOOK_REGEX);
  if (!whMatch) return [];

  const whRes = await fetch(
    `https://discord.com/api/v10/webhooks/${whMatch[2]}/${whMatch[3]}`,
  );
  if (!whRes.ok) return [];

  const webhook = (await whRes.json()) as { guild_id?: string };
  if (!webhook.guild_id) return [];

  const rolesRes = await fetch(
    `https://discord.com/api/v10/guilds/${webhook.guild_id}/roles`,
    { headers: { Authorization: `Bot ${token}` } }
  );
  if (!rolesRes.ok) return [];

  const roles = (await rolesRes.json()) as Array<{
    id: string;
    name: string;
    color: number;
  }>;

  const data = roles.map((r) => ({ id: r.id, name: r.name, color: r.color }));
  roleCache.set(webhookUrl, { data, ts: Date.now() });
  return data;
}

let botGuildsCache: { data: { id: string }[]; ts: number } | null = null;

async function fetchBotGuilds(token: string): Promise<{ id: string }[]> {
  if (botGuildsCache && Date.now() - botGuildsCache.ts < CACHE_TTL) return botGuildsCache.data;

  const res = await fetch("https://discord.com/api/v10/users/@me/guilds", {
    headers: { Authorization: `Bot ${token}` },
  });
  if (!res.ok) return [];

  const guilds = (await res.json()) as { id: string }[];
  botGuildsCache = { data: guilds, ts: Date.now() };
  return guilds;
}

async function fetchGuildRolesDirect(
  guildId: string,
  token: string
): Promise<RoleData[]> {
  const cacheKey = `guild:${guildId}`;
  const cached = roleCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  const rolesRes = await fetch(
    `https://discord.com/api/v10/guilds/${guildId}/roles`,
    { headers: { Authorization: `Bot ${token}` } }
  );
  if (!rolesRes.ok) {
    // Cache negative result to avoid repeated 403s
    roleCache.set(cacheKey, { data: [], ts: Date.now() });
    return [];
  }

  const roles = (await rolesRes.json()) as Array<{
    id: string;
    name: string;
    color: number;
  }>;

  const data = roles.map((r) => ({ id: r.id, name: r.name, color: r.color }));
  roleCache.set(cacheKey, { data, ts: Date.now() });
  return data;
}

export async function POST(req: NextRequest) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Bot token not configured" }, { status: 500 });
  }

  const body = (await req.json()) as {
    userIds?: string[];
    roleIds?: string[];
    webhookUrl?: string;
    guildId?: string;
  };

  const results: {
    users: Record<string, UserData>;
    roles: Record<string, RoleData>;
  } = { users: {}, roles: {} };

  const userIds = (body.userIds || []).filter((id) => ID_REGEX.test(id));
  if (userIds.length > 0) {
    const fetched = await Promise.all(
      userIds.slice(0, 20).map((id) => fetchUser(id, token))
    );
    fetched.forEach((u) => {
      if (u) results.users[u.id] = u;
    });
  }

  const roleIds = (body.roleIds || []).filter((id) => ID_REGEX.test(id));
  if (roleIds.length > 0) {
    const remaining = new Set(roleIds);

    // Try specific guild first
    if (body.guildId && ID_REGEX.test(body.guildId)) {
      const roles = await fetchGuildRolesDirect(body.guildId, token);
      for (const role of roles) {
        if (remaining.has(role.id)) {
          results.roles[role.id] = role;
          remaining.delete(role.id);
        }
      }
    }

    // Try webhook guild
    if (remaining.size > 0 && body.webhookUrl) {
      const roles = await fetchGuildRoles(body.webhookUrl, token);
      for (const role of roles) {
        if (remaining.has(role.id)) {
          results.roles[role.id] = role;
          remaining.delete(role.id);
        }
      }
    }

    // Fallback 1: search all bot guilds for remaining role IDs
    if (remaining.size > 0) {
      const guilds = await fetchBotGuilds(token);
      for (const guild of guilds) {
        if (remaining.size === 0) break;
        const roles = await fetchGuildRolesDirect(guild.id, token);
        for (const role of roles) {
          if (remaining.has(role.id)) {
            results.roles[role.id] = role;
            remaining.delete(role.id);
          }
        }
      }
    }

    // Fallback 2: try user's guilds via OAuth (bot attempts to fetch roles)
    if (remaining.size > 0) {
      const session = await getServerSession(authOptions);
      const accessToken = (session?.user as { accessToken?: string } | undefined)?.accessToken;
      if (accessToken) {
        const userGuildsRes = await fetch("https://discord.com/api/v10/users/@me/guilds", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (userGuildsRes.ok) {
          const userGuilds = (await userGuildsRes.json()) as { id: string }[];
          for (const guild of userGuilds) {
            if (remaining.size === 0) break;
            // Try fetching roles via bot — will 403 if bot not on server (cached, cheap)
            const roles = await fetchGuildRolesDirect(guild.id, token);
            for (const role of roles) {
              if (remaining.has(role.id)) {
                results.roles[role.id] = role;
                remaining.delete(role.id);
              }
            }
          }
        }
      }
    }
  }

  return NextResponse.json(results);
}
