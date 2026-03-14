import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const DISCORD_API = "https://discord.com/api/v10";

interface DiscordChannel {
  id: string;
  name: string;
  type: number;
  parent_id: string | null;
  position: number;
}

// Channel types that can receive messages
const TEXT_TYPES = new Set([0, 5, 10, 11, 12, 15, 16]);

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const guildId = req.nextUrl.searchParams.get("guildId");
  if (!guildId) {
    return NextResponse.json({ error: "guildId is required" }, { status: 400 });
  }

  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ error: "Bot not configured" }, { status: 500 });
  }

  const res = await fetch(`${DISCORD_API}/guilds/${guildId}/channels`, {
    headers: { Authorization: `Bot ${botToken}` },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch channels" }, { status: 502 });
  }

  const channels = (await res.json()) as DiscordChannel[];

  // Build category map
  const categories = new Map<string, string>();
  for (const ch of channels) {
    if (ch.type === 4) categories.set(ch.id, ch.name);
  }

  // Return text channels with category name
  const result = channels
    .filter((ch) => TEXT_TYPES.has(ch.type))
    .sort((a, b) => a.position - b.position)
    .map((ch) => ({
      id: ch.id,
      name: ch.name,
      category: ch.parent_id ? categories.get(ch.parent_id) ?? null : null,
      type: ch.type,
    }));

  return NextResponse.json(result);
}
