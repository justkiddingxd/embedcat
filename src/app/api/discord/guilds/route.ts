import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const DISCORD_API = "https://discord.com/api/v10";
const ADMINISTRATOR = BigInt(0x8);
const MANAGE_WEBHOOKS = BigInt(0x20000000);
const MANAGE_GUILD = BigInt(0x20);

interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  permissions: string;
}

// Simple in-memory cache to avoid Discord rate limits
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 60_000; // 60 seconds

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data as T;
  return null;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, ts: Date.now() });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const accessToken = (session?.user as { accessToken?: string } | undefined)?.accessToken;

  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated", needsReauth: true }, { status: 401 });
  }

  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ error: "Bot not configured" }, { status: 500 });
  }

  // Check cache first
  const cacheKey = `guilds:${accessToken.slice(-8)}`;
  const cached = getCached<{ id: string; name: string; icon: string | null }[]>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  // Fetch user's guilds
  const userGuildsRes = await fetch(`${DISCORD_API}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userGuildsRes.ok) {
    if (userGuildsRes.status === 401) {
      return NextResponse.json({ error: "token_expired", needsReauth: true }, { status: 401 });
    }
    if (userGuildsRes.status === 429) {
      return NextResponse.json({ error: "Rate limited, try again shortly" }, { status: 429 });
    }
    return NextResponse.json({ error: "Failed to fetch guilds" }, { status: 502 });
  }

  const userGuilds = (await userGuildsRes.json()) as DiscordGuild[];

  // Filter: user must have management permissions
  const adminGuilds = userGuilds.filter((g) => {
    const perms = BigInt(g.permissions);
    return (perms & ADMINISTRATOR) !== BigInt(0) ||
           (perms & MANAGE_WEBHOOKS) !== BigInt(0) ||
           (perms & MANAGE_GUILD) !== BigInt(0);
  });

  // Check which guilds the bot is in
  const botGuildsRes = await fetch(`${DISCORD_API}/users/@me/guilds`, {
    headers: { Authorization: `Bot ${botToken}` },
  });

  const botGuildIds = new Set<string>();
  if (botGuildsRes.ok) {
    const botGuilds = (await botGuildsRes.json()) as { id: string }[];
    for (const g of botGuilds) botGuildIds.add(g.id);
  }

  // Return only guilds where user has perms AND bot is present
  const result = adminGuilds
    .filter((g) => botGuildIds.has(g.id))
    .map((g) => ({
      id: g.id,
      name: g.name,
      icon: g.icon
        ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=64`
        : null,
    }));

  setCache(cacheKey, result);
  return NextResponse.json(result);
}
