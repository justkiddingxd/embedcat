import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

const DISCORD_API = "https://discord.com/api/v10";

interface ButtonActionInput {
  buttonId: string;
  label: string;
  style?: number;
  actions: {
    order: number;
    type: string;
    config?: Prisma.InputJsonValue;
  }[];
}

interface SendRequestBody {
  channelId: string;
  guildId: string;
  embedId?: string;
  payload: Record<string, unknown>;
  buttonActions?: ButtonActionInput[];
}

const ADMINISTRATOR = BigInt(1 << 3);
const MANAGE_WEBHOOKS = BigInt(1 << 29);

async function checkUserGuildPermissions(
  botToken: string,
  guildId: string,
  userId: string,
): Promise<{ allowed: boolean; error?: string }> {
  if (!guildId) return { allowed: false, error: "guildId is required for permission check" };

  try {
    // Check if user is guild owner
    const guildRes = await fetch(
      `${DISCORD_API}/guilds/${guildId}`,
      { headers: { Authorization: `Bot ${botToken}` } },
    );

    if (!guildRes.ok) {
      console.error("[bot/send] Failed to fetch guild:", guildRes.status);
      return { allowed: false, error: `Failed to fetch server info (${guildRes.status})` };
    }

    const guild = (await guildRes.json()) as { owner_id: string; roles: { id: string; permissions: string }[] };

    if (guild.owner_id === userId) return { allowed: true };

    // Fetch member roles
    const memberRes = await fetch(
      `${DISCORD_API}/guilds/${guildId}/members/${userId}`,
      { headers: { Authorization: `Bot ${botToken}` } },
    );

    if (!memberRes.ok) {
      if (memberRes.status === 404) {
        return { allowed: false, error: "You are not a member of this server" };
      }
      console.error("[bot/send] Failed to fetch member:", memberRes.status);
      return { allowed: false, error: `Failed to verify membership (${memberRes.status})` };
    }

    const member = (await memberRes.json()) as { roles: string[] };

    // Calculate permissions from roles
    const roles = guild.roles ?? [];
    const everyoneRole = roles.find((r) => r.id === guildId);
    let permissions = BigInt(everyoneRole?.permissions ?? "0");

    for (const roleId of member.roles) {
      const role = roles.find((r) => r.id === roleId);
      if (role) permissions |= BigInt(role.permissions);
    }

    if ((permissions & ADMINISTRATOR) !== BigInt(0)) return { allowed: true };
    if ((permissions & MANAGE_WEBHOOKS) !== BigInt(0)) return { allowed: true };

    return { allowed: false, error: "You need Administrator or Manage Webhooks permission on this server" };
  } catch (err) {
    console.error("[bot/send] Permission check error:", err);
    return { allowed: false, error: "Failed to verify permissions" };
  }
}

export async function POST(req: NextRequest) {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ error: "Bot token not configured" }, { status: 500 });
  }

  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = (await req.json()) as SendRequestBody;
  const { channelId, payload, buttonActions, embedId } = body;

  if (!channelId) {
    return NextResponse.json({ error: "channelId is required" }, { status: 400 });
  }

  if (!body.guildId) {
    return NextResponse.json({ error: "guildId is required" }, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "payload is required" }, { status: 400 });
  }

  const permCheck = await checkUserGuildPermissions(botToken, body.guildId, userId);
  if (!permCheck.allowed) {
    return NextResponse.json({ error: permCheck.error }, { status: 403 });
  }

  const messagePayload: Record<string, unknown> = { ...payload };
  delete messagePayload.username;
  delete messagePayload.avatar_url;

  // If payload already has components with buttons (v2 mode), don't duplicate them.
  // Only add action rows if the payload has no components at all (classic mode).
  if (buttonActions && buttonActions.length > 0 && !Array.isArray(messagePayload.components)) {
    const buttons = buttonActions.map((ba) => ({
      type: 2,
      style: ba.style ?? 1,
      label: ba.label,
      custom_id: ba.buttonId,
    }));

    const rows: Record<string, unknown>[] = [];
    for (let i = 0; i < buttons.length; i += 5) {
      rows.push({
        type: 1,
        components: buttons.slice(i, i + 5),
      });
    }

    messagePayload.components = rows;
  }

  if (!messagePayload.content && !messagePayload.embeds && !messagePayload.components) {
    messagePayload.content = "\u200b";
  }

  let res: Response;
  try {
    res = await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messagePayload),
    });
  } catch (err) {
    console.error("[bot/send] Discord API fetch failed:", err);
    return NextResponse.json({ error: "Failed to reach Discord API" }, { status: 502 });
  }

  let data: Record<string, unknown> = {};
  const contentLength = res.headers.get("content-length");
  if (contentLength !== "0" && res.headers.get("content-type")?.includes("application/json")) {
    data = (await res.json().catch(() => ({ message: res.statusText }))) as Record<string, unknown>;
  }

  if (!res.ok) {
    console.error("[bot/send] Discord API error:", res.status, JSON.stringify(data));
    return NextResponse.json(
      { error: (data.message as string) || `HTTP ${res.status}` },
      { status: res.status },
    );
  }

  const messageId = data.id as string | undefined;

  if (buttonActions && buttonActions.length > 0) {
    await Promise.all(
      buttonActions.map((ba) =>
        prisma.buttonAction.upsert({
          where: { buttonId: ba.buttonId },
          create: {
            embedId: embedId ?? null,
            messageId: messageId ?? null,
            buttonId: ba.buttonId,
            label: ba.label,
            style: ba.style ?? 1,
            actions: {
              create: ba.actions.map((a) => ({
                order: a.order,
                type: a.type,
                config: a.config ?? {},
              })),
            },
          },
          update: {
            messageId: messageId ?? null,
            label: ba.label,
            style: ba.style ?? 1,
            actions: {
              deleteMany: {},
              create: ba.actions.map((a) => ({
                order: a.order,
                type: a.type,
                config: a.config ?? {},
              })),
            },
          },
        }),
      ),
    );
  }

  prisma.appUser
    .update({
      where: { discordId: userId },
      data: { webhooksSent: { increment: 1 }, lastActive: new Date() },
    })
    .catch(() => void 0);

  return NextResponse.json({ success: true, messageId });
}
