import { NextRequest, NextResponse } from "next/server";

const ID_REGEX = /^\d{17,20}$/;
const cache = new Map<string, { data: Record<string, unknown>; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id || !ID_REGEX.test(id)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Bot token not configured" }, { status: 500 });
  }

  const cached = cache.get(id);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  const res = await fetch(`https://discord.com/api/v10/users/${id}`, {
    headers: { Authorization: `Bot ${token}` },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: `Discord API ${res.status}` },
      { status: res.status }
    );
  }

  const user = await res.json() as {
    id: string;
    username: string;
    global_name: string | null;
    avatar: string | null;
    discriminator: string;
  };

  const data = {
    id: user.id,
    username: user.username,
    display_name: user.global_name || user.username,
    avatar: user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp?size=64`
      : null,
  };

  cache.set(id, { data, ts: Date.now() });

  return NextResponse.json(data);
}
